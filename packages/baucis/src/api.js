const semver = require('semver');
const errors = require('restify-errors');

module.exports = (express, Controller) => {
  /**
   * Returns a Baucis API
   *
   * the api is an express router
   */
  function getApi() {
    const api = express.Router(arguments);
    // ¤Note: express middleware cannot be extend by another class
    // Hence the methods attach to hit
    // This is not a constructor

    api.use(function(res, req, next) {
      if (res.baucis)
        return next(new errors.InternalServerError('Baucis request property already created'));

      res.baucis = {};
      req.removeHeader('x-powered-by');
      // Any caching proxies should be aware of API version.
      req.vary('API-Version');
      // TODO move this
      // Requested range is used to select highest possible release number.
      // Then later controllers are checked for matching the release number.
      const version = res.headers['api-version'] || '*';
      // Check the requested API version is valid.
      if (!semver.validRange(version)) {
        next(
          new errors.BadRequestError(
            `The requested API version range "${version}" was not a valid semver range`
          )
        );
        return;
      }

      res.baucis.release = semver.maxSatisfying(api.releases(), version);
      // Check for API version unsatisfied and give a 400 if no versions match.
      if (!res.baucis.release) {
        next(
          new errors.BadRequestError(
            `The requested API version range "${version}" could not be satisfied`
          )
        );
        return;
      }

      req.set('API-Version', res.baucis.release);
      next();
    });

    api._releases = ['0.0.1'];
    api.releases = function(release) {
      if (arguments.length === 1) {
        if (!semver.valid(release)) {
          throw new errors.InternalServerError(
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
      const Ctrl = getApi.Controller; // ¤hack: for some reason Api.Controller(model) dont run
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
      return satisfies.filter(controller => fragment === controller.fragment());
    };
    /**
     * Find the correct controller to handle the request.
     */
    api.use('/:path', (req, res, next) => {
      const fragment = `/${req.params.path}`;
      const controllers = api.controllers(req.baucis.release, fragment);
      // If not found, bail.
      if (controllers.length === 0) return next();

      req.baucis.controller = controllers[0];
      req.baucis.controller(req, res, next);
    });

    getApi.__extensions__.map(ext => ext(api));
    return api;
  }
  getApi.Controller = Controller;
  getApi.__extensions__ = [];
  getApi.addExtension = extension => {
    getApi.__extensions__.push(extension);
  };
  return getApi;
};
