const RestError = require('rest-error');
const ApiFactory = require('./src/api');
const ControllerFactory = require('./src/controller');
const extendMongooseModel = require('./src/model');

const builtInPlugins = {
  json: require('@coorpacademy/baucis-json'),
  links: require('@coorpacademy/baucis-links')
};

module.exports = function(mongoose, express) {
  const baucis = function() {
    return baucis.get();
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

  baucis.get = function(options = {finalize: true}) {
    const current = instance;
    if (options === true || options.finalize) instance = new Api();
    return current;
  };
  // alias for empty, which might at some point superseed it, and empty deprecated
  baucis.empty = () => baucis.get();

  baucis._formatters = function(response, callback) {
    // if (response._headerSent) {
    //   callback(null, function () {
    //     return miss.through(function (data, encoding, callback) { console.log(data); callback(); });
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
  baucis.setFormatter = function(mime, formatter) {
    formatters[mime] = callback => () => callback(null, formatter);
    return baucis;
  };

  /**
   * Baucis parser that Default to JSON when no MIME type is provided
   */
  baucis.parser = function(mime) {
    const mimeType = mime ? mime.split(';')[0].trim() : 'application/json';
    // Not interested in any additional parameters at this point.
    const handler = parsers[mimeType];
    return handler && handler();
  };

  /**
   * Adds a parser for the given mime type.  Needs a function that returns a stream.
   */
  baucis.setParser = function(mime, parser) {
    parsers[mime] = parser;
    return baucis;
  };

  baucis.addPlugin = (...plugins) => {
    plugins.map(plugin => plugin(baucis));
    return baucis;
  };

  baucis.Api = Api;
  baucis.Controller = Controller;
  baucis.Error = RestError;
  baucis.Api.Controller = Controller;

  baucis.addPlugin(builtInPlugins.links);
  baucis.addPlugin(builtInPlugins.json);

  return baucis;
};
