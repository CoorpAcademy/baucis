const RestError = require('rest-error');
const ApiFactory = require('./src/api');
const ControllerFactory = require('./src/controller');
const extendMongooseModel = require('./src/model');

const plugins = {
  json: require('@coorpacademy/baucis-json'),
  links: require('@coorpacademy/baucis-links')
};

module.exports = function(mongoose, express) {
  const baucis = function(options) {
    return baucis.empty();
  };

  const _mongoose = mongoose || require('mongoose');
  const _express = express || require('express');
  const Controller = ControllerFactory(baucis, _mongoose, _express);
  extendMongooseModel(_mongoose);
  const Api = ApiFactory(_express, Controller);

  let instance;
  const parsers = {};
  const formatters = {};

  baucis.rest = function(model) {
    if (!instance) instance = new Api();
    return instance.rest(model);
  };

  baucis.empty = function() {
    // TODO : rename
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

  /**
   * Adds a formatter for the given mime type.  Needs a function that returns a stream.
   */
  baucis.setFormatter = function(mime, f) {
    formatters[mime] = function(callback) {
      return function() {
        callback(null, f);
      };
    };
    return baucis;
  };

  /**
   * Baucis parser that Default to JSON when no MIME type is provided
   */
  baucis.parser = function(mime, handler) {
    mime = mime || 'application/json';
    // Not interested in any additional parameters at this point.
    mime = mime.split(';')[0].trim();
    handler = parsers[mime];
    return handler ? handler() : undefined;
  };

  /**
   * Adds a parser for the given mime type.  Needs a function that returns a stream.
   */
  baucis.setParser = function(mime, f) {
    parsers[mime] = f;
    return baucis;
  };

  baucis.addPlugin = plugin => {
    plugin(baucis);
    return baucis;
  };

  baucis.Api = Api;
  baucis.Controller = Controller;
  baucis.Error = RestError;
  baucis.Api.Controller = Controller;

  baucis.addPlugin(plugins.links);
  baucis.addPlugin(plugins.json);

  return baucis;
};
