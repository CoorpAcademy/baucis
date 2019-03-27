const _ = require('lodash/fp');

// Figure out the basePath for Swagger API definition
function getBase(request, extra) {
  const parts = request.originalUrl.split('/');
  // Remove extra path parts.
  parts.splice(-extra, extra);
  return `${request.protocol}://${request.headers.host}${parts.join('/')}`;
}

// A method for generating a Swagger resource listing
function generateResourceListing(options) {
  const plurals = options.controllers.map(function(controller) {
    return controller.model().plural();
  });
  const listing = {
    apiVersion: options.version,
    swaggerVersion: '1.1',
    basePath: options.basePath,
    apis: plurals.map(function(plural) {
      return {path: `/documentation/${plural}`, description: `Operations about ${plural}.`};
    })
  };

  return listing;
}

module.exports = (pluginOptions = {}) =>
  function extendApi(api) {
    // Middleware for the documentation index.
    api.get('/documentation', function(request, response) {
      response.json(
        generateResourceListing({
          version: request.baucis.release,
          controllers: api.controllers(request.baucis.release),
          basePath: getBase(request, 1)
        })
      );
    });

    // Find the correct controller to handle the request.
    api.get('/documentation/:path', function(request, response, next) {
      const fragment = `/${request.params.path}`;
      const controllers = api.controllers(request.baucis.release, fragment);
      // If not found, bail.
      if (controllers.lenth === 0) return next();

      controllers[0].generateSwagger();

      response.json(
        _.merge(controllers[0].swagger, {
          apiVersion: request.baucis.release,
          swaggerVersion: '1.1',
          basePath: getBase(request, 2),
          resourcePath: fragment
        })
      );
    });

    return api;
  };
