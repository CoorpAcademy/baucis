// __Dependencies__
const RestError = require('rest-error');
const ApiFactory = require('./src/api');
const ControllerFactory = require('./src/controller');
const extendMongooseModel = require('./src/model');

const plugins = {
  json: require('baucis-json'),
  links: require('baucis-links')
};

module.exports = function(mongoose, express) {
  const _mongoose = mongoose || require('mongoose');
  const _express = express || require('express');
  const Controller = ControllerFactory(_mongoose, _express);
  extendMongooseModel(_mongoose);
  const Api = ApiFactory(_express, Controller);

  let instance;
  const parsers = {};
  const formatters = {};

  // __Module Definition__
  const baucis = function(options) {
    return baucis.empty();
  };

  // __Public Members__
  baucis.rest = function(model) {
    if (!instance) instance = new Api();
    return instance.rest(model);
  };

  baucis.empty = function() {
    const previous = instance;
    instance = new Api();
    return previous;
  };

  baucis.formatters = function(response, callback) {
    // if (response._headerSent) {
    //   callback(null, function () {
    //     return eventStream.through(function (data) { console.log(data) }, function () {
    //       this.emit('end');
    //     });
    //   });
    //   return;
    // }

    const handlers = {
      default() {
        callback(RestError.NotAcceptable());
      }
    };

    Object.keys(formatters).forEach(function(mime) {
      handlers[mime] = formatters[mime](callback);
    });
    response.format(handlers);
    return;
  };

  // Adds a formatter for the given mime type.  Needs a function that returns a stream.
  baucis.setFormatter = function(mime, f) {
    formatters[mime] = function(callback) {
      return function() {
        callback(null, f);
      };
    };
    return baucis;
  };

  baucis.parser = function(mime, handler) {
    // Default to JSON when no MIME type is provided.
    mime = mime || 'application/json';
    // Not interested in any additional parameters at this point.
    mime = mime.split(';')[0].trim();
    handler = parsers[mime];
    return handler ? handler() : undefined;
  };

  // Adds a parser for the given mime type.  Needs a function that returns a stream.
  baucis.setParser = function(mime, f) {
    parsers[mime] = f;
    return baucis;
  };

  // __Expose Modules__
  baucis.Api = Api;
  baucis.Controller = Controller;
  baucis.Error = RestError;
  /////baucis.Model = Model;

  Controller.container(baucis);
  RestError.container(baucis);

  // __Plugins__
  plugins.json.apply(baucis);
  plugins.links.apply(baucis);

  return baucis;
};
