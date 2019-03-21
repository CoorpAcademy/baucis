// __Dependencies__
const RestError = require('rest-error');

// __Private Module Members__
// Expands route definitions based on generalized arguments.
const defineRoutes = function(stage, params) {
  const argumentsArray = Array.prototype.slice.call(params);

  const options = last(0, ['endpoint', 'methods', 'middleware'], argumentsArray);
  options.stage = stage;

  return factor(options);
};
// A filter function for checking a given value is defined and not null.
function exists(o) {
  return o !== undefined && o !== null;
}
// Handle variable number of arguments
function last(skip, names, values) {
  const r = {};
  let position = names.length;
  const count = values.filter(exists).length - skip;
  if (count < 1) throw RestError.Misconfigured('Too few arguments.');

  names.forEach(function(name) {
    const index = skip + count - position;
    position--;
    if (index >= skip) r[name] = values[index];
  });

  return r;
}
// Returns `true` if the given stirng is a recognized HTTP method.
function isRecognizedMethod(s) {
  return !!/^all|head|get|put|post|delete$/.exec(s);
}
// Parse middleware into an array of middleware definitions for each endpoint and method
function factor(options) {
  const factored = [];
  let methodString = options.methods;
  let methods;

  if (methodString) methodString = methodString.toLowerCase();

  if (!methodString || methodString === '*') methodString = 'all';
  methods = methodString.split(/\s+/);

  methods.forEach(function(method) {
    if (!isRecognizedMethod(method))
      throw RestError.Misconfigured('Unrecognized HTTP method: "%s"', method);
  });

  if (!options.stage) throw RestError.Misconfigured('The middleware stage was not provided');
  if (options.endpoint && options.endpoint !== 'instance' && options.endpoint !== 'collection') {
    throw RestError.Misconfigured(
      'End-point type must be either "instance" or "collection," not "%s"',
      options.endpoint
    );
  }
  // Middleware function or array
  if (!Array.isArray(options.middleware) && typeof options.middleware !== 'function') {
    throw RestError.Misconfigured('Middleware must be an array or function');
  }
  // Check endpoint is valid
  if (
    options.endpoint !== undefined &&
    options.endpoint !== 'instance' &&
    options.endpoint !== 'collection'
  ) {
    throw RestError.Misconfigured(
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
// __Module Definition__
module.exports = function(options, protect) {
  const controller = this;
  // __Private Instance Members__
  // A method used to activate middleware for a particular stage.
  function activate(definition) {
    const stage = protect.controllerForStage[definition.stage];
    const f = stage[definition.method].bind(stage);
    if (definition.endpoint === 'instance') f('/:id', definition.middleware);
    else f('/', definition.middleware);
  }
  // __Protected Instance Members__
  protect.finalize = function(endpoint, methods, middleware) {
    defineRoutes('finalize', arguments).forEach(activate);
    return controller;
  };
  // __Public Instance Members__
  // A method used to activate request-stage middleware.
  controller.request = function(endpoint, methods, middleware) {
    defineRoutes('request', arguments).forEach(activate);
    return controller;
  };
  // A method used to activate query-stage middleware.
  controller.query = function(endpoint, methods, middleware) {
    defineRoutes('query', arguments).forEach(activate);
    return controller;
  };
};
