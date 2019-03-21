// __Dependencies__
const semver = require('semver');

// __Module Definition__
module.exports = function(options, protect) {
  const api = this;
  const controllers = [];

  // __Public Instance Members__
  // Add a controller to the API.
  api.add = function(controller) {
    controllers.push(controller);
    return api;
  };
  // Return a copy of the controllers array, optionally filtered by release.
  protect.controllers = function(release, fragment) {
    const all = [].concat(controllers);

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
  api.use('/:path', function(request, response, next) {
    const fragment = `/${request.params.path}`;
    const controllers = protect.controllers(request.baucis.release, fragment);
    // If not found, bail.
    if (controllers.length === 0) return next();

    request.baucis.controller = controllers[0];
    request.baucis.controller(request, response, next);
  });
};
