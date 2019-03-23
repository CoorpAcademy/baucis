const semver = require('semver');
const RestError = require('rest-error');

module.exports = (express, Controller) => {
  function Api() {
    const api = express.Router(arguments); //§FIXME tocheck

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
          RestError.BadRequest(
            'The requested API version range "%s" could not be satisfied',
            version
          )
        );
        return;
      }

      response.set('API-Version', request.baucis.release);
      next();
    });

    api._releases = ['0.0.1'];
    api.releases = function(release) {
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

    api.rest = model => {
      const Ctrl = Api.Controller; // ¤hack: for some reason Api.Controller(model) dont run
      const controller = new Ctrl(model);
      api.add(controller);
      return controller;
    };

    api._controllers = [];

    // Add a controller to the API.
    api.add = function(controller) {
      this._controllers.push(controller);
      return api;
    };

    /**
     * Return a copy of the controllers array, optionally filtered by release.
     */
    api.controllers = function(release, fragment) {
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
    /**
     * Find the correct controller to handle the request.
     */
    api.use('/:path', (request, response, next) => {
      const fragment = `/${request.params.path}`;
      const controllers = api.controllers(request.baucis.release, fragment);
      // If not found, bail.
      if (controllers.length === 0) return next();

      request.baucis.controller = controllers[0];
      request.baucis.controller(request, response, next);
    });

    Api.__extensions__.map(ext => ext(api));
    return api;
  }
  Api.Controller = Controller;
  Api.__extensions__ = [];
  Api.addExtension = extension => {
    Api.__extensions__.push(extension);
  };
  return Api;
};
