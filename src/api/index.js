// __Dependencies__
var deco = require('deco');
var semver = require('semver');
var express = require('express');
var Controller = require('../controller');
var RestError = require('rest-error');

// __Module Definition__
var Api = module.exports = deco(function (options, protect) {
  var api = this;

  api.use(function (request, response, next) {
    if (request.baucis) return next(RestError.Misconfigured('Baucis request property already created'));

    request.baucis = {};
    response.removeHeader('x-powered-by');
    // Any caching proxies should be aware of API version.
    response.vary('API-Version');
    // TODO move this
    // Requested range is used to select highest possible release number.
    // Then later controllers are checked for matching the release number.
    var version = request.headers['api-version'] || '*';
    // Check the requested API version is valid.
    if (!semver.validRange(version)) {
      next(RestError.BadRequest('The requested API version range "%s" was not a valid semver range', version));
      return;
    }

    request.baucis.release = semver.maxSatisfying(api.releases(), version);
    // Check for API version unsatisfied and give a 400 if no versions match.
    if (!request.baucis.release) {
      next(RestError.BadRequest('The requested API version range "%s" could not be satisfied', version));
      return;
    }

    response.set('API-Version', request.baucis.release);
    next();
  });

  // __Public Members___
  protect.property('releases', [ '0.0.1' ], function (release) {
    if (!semver.valid(release)) {
      throw RestError.Misconfigured('Release version "%s" is not a valid semver version', release);
    }
    return this.releases().concat(release);
  });

  api.rest = function (model) {
    var controller = Controller(model);
    api.add(controller);
    return controller;
  };
});

Api.factory(express.Router);
Api.decorators(__dirname, ['controllers']);
