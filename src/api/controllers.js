// __Dependencies__
var util = require('util');
var semver = require('semver');
var RestError = require('rest-error');

// __Module Definition__
var plugin = module.exports = function (options, protect) {
  var api = this;
  var controllers = [];

  // __Public Instance Members__
  // Add a controller to the API.
  api.add = function (controller) {
    controllers.push(controller);
    return api;
  };
  // Return a copy of the controllers array, optionally filtered by release.
  protect.controllers = function (release, fragment) {
    var all = [].concat(controllers);

    if (!release) return all;

    var satisfies = all.filter(function (controller) {
      return semver.satisfies(release, controller.versions());
    });

    if (!fragment) {
      return satisfies;
    }

    // Find the matching controller among controllers that match the requested release.
    return satisfies.filter(function (controller) {
      return fragment === controller.fragment();
    });
  };
  // Find the correct controller to handle the request.
  api.use('/:path', function (request, response, next) {
    var fragment = '/' + request.params.path;
    var controllers = protect.controllers(request.baucis.release, fragment);
    // If not found, bail.
    if (controllers.length === 0) return next();

    request.baucis.controller = controllers[0];
    request.baucis.controller(request, response, next);
  });
};
