const errors = require('restify-errors');
const {last} = require('./predicates-and-accessors');

// Returns `true` if the given stirng is a recognized HTTP method.
const httpMethods = ['all', 'get', 'post', 'put', 'delete', 'head'];
function isRecognizedMethod(s) {
  return httpMethods.includes(s);
}
// Parse middleware into an array of middleware definitions for each endpoint and method
function factor(options) {
  const factored = [];
  let methodString = options.methods;

  if (methodString) methodString = methodString.toLowerCase();

  if (!methodString || methodString === '*') methodString = 'all';
  const methods = methodString.split(/\s+/);

  methods.forEach(function(method) {
    if (!isRecognizedMethod(method))
      throw new errors.InternalServerError(
        `Misconfiguration: Unrecognized HTTP method: "${method}"`
      );
  });

  if (!options.stage)
    throw new errors.InternalServerError('Misconfiguration: The middleware stage was not provided');
  if (options.endpoint && options.endpoint !== 'instance' && options.endpoint !== 'collection') {
    throw new errors.InternalServerError(
      `Misconfiguration: End-point type must be either "instance" or "collection," not "${
        options.endpoint
      }"'`
    );
  }
  // Middleware function or array
  if (!Array.isArray(options.middleware) && typeof options.middleware !== 'function') {
    throw new errors.InternalServerError(
      'Misconfiguration: Middleware must be an array or function'
    );
  }
  // Check endpoint is valid
  if (
    options.endpoint !== undefined &&
    options.endpoint !== 'instance' &&
    options.endpoint !== 'collection'
  ) {
    throw new errors.InternalServerError(
      'End-point type must be either "instance" or "collection," not "%s"',
      options.endpoint
    );
  }
  // Add definitions for one or both endpoints, for each HTTP method.
  methods.forEach(function(method) {
    if (options.endpoint !== 'collection')
      factored.push({
        stage: options.stage,
        endpoint: 'instance',
        method,
        middleware: options.middleware
      });
    if (options.endpoint !== 'instance')
      factored.push({
        stage: options.stage,
        endpoint: 'collection',
        method,
        middleware: options.middleware
      });
  });

  return factored;
}

// Expands route definitions based on generalized arguments.
const defineRoutes = function(stage, params) {
  const argumentsArray = Array.prototype.slice.call(params);

  const options = last(0, ['endpoint', 'methods', 'middleware'], argumentsArray);
  options.stage = stage;

  return factor(options);
};

function combineErrorMiddleware(middlewares) {
  return middlewares.reduce((mid1, mid2) => {
    return function(err, req, res, next) {
      mid1(err, req, res, function(err2) {
        if (!err2) return next();
        mid2(err2, req, res, next);
      });
    };
  });
}

module.exports = {
  isRecognizedMethod,
  factor,
  defineRoutes,
  combineErrorMiddleware
};
