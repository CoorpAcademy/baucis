// __Dependencies__
const deco = require('deco');
const semver = require('semver');
const express = require('express');
const RestError = require('rest-error');
const Controller = require('./controller');

// __Module Definition__
const Api = deco(function(options) {
  const api = this;

  api.use(function(request, response, next) {
    if (request.baucis)
      return next(RestError.Misconfigured('Baucis request property already created'));

    request.baucis = {};
    response.removeHeader('x-powered-by');
    // Any caching proxies should be aware of API version.
    response.vary('API-Version');
    // TODO move this
    // Requested range is used to select highest possible release number.
    // Then later controllers are checked for matching the release number.
    const version = request.headers['api-version'] || '*';
    // Check the requested API version is valid.
    if (!semver.validRange(version)) {
      next(
        RestError.BadRequest(
          'The requested API version range "%s" was not a valid semver range',
          version
        )
      );
      return;
    }

    request.baucis.release = semver.maxSatisfying(api.releases(), version);
    // Check for API version unsatisfied and give a 400 if no versions match.
    if (!request.baucis.release) {
      next(
        RestError.BadRequest('The requested API version range "%s" could not be satisfied', version)
      );
      return;
    }

    response.set('API-Version', request.baucis.release);
    next();
  });

  this._releases = ['0.0.1'];
  this.releases = function(release) {
    if (arguments.length === 1) {
      if (!semver.valid(release)) {
        throw RestError.Misconfigured(
          'Release version "%s" is not a valid semver version',
          release
        );
      }
      this._releases = this._releases.concat(release);
      return this;
    }
    return this._releases;
  };

  this.rest = function(model) {
    const controller = Controller(model);
    api.add(controller);
    return controller;
  };

  this._controllers = [];

  // __Public Instance Members__
  // Add a controller to the API.
  this.add = function(controller) {
    this._controllers.push(controller);
    return api;
  };
  // Return a copy of the controllers array, optionally filtered by release.
  this.controllers = function(release, fragment) {
    const all = [].concat(this._controllers);

    if (!release) return all;

    const satisfies = all.filter(function(controller) {
      return semver.satisfies(release, controller.versions());
    });

    if (!fragment) {
      return satisfies;
    }

    // Find the matching controller among controllers that match the requested release.
    return satisfies.filter(function(controller) {
      return fragment === controller.fragment();
    });
  };
  // Find the correct controller to handle the request.
  api.use('/:path', (request, response, next) => {
    const fragment = `/${request.params.path}`;
    const controllers = this.controllers(request.baucis.release, fragment);
    // If not found, bail.
    if (controllers.length === 0) return next();

    request.baucis.controller = controllers[0];
    request.baucis.controller(request, response, next);
  });
});

Api.factory(express.Router);

module.exports = Api;
