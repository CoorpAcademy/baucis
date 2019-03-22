// __Dependencies__
const domain = require('domain');
const express = require('express');
const RestError = require('rest-error');
const eventStream = require('event-stream');

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

  if (methodString) methodString = methodString.toLowerCase();

  if (!methodString || methodString === '*') methodString = 'all';
  const methods = methodString.split(/\s+/);

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

// Expands route definitions based on generalized arguments.
const defineRoutes = function(stage, params) {
  const argumentsArray = Array.prototype.slice.call(params);

  const options = last(0, ['endpoint', 'methods', 'middleware'], argumentsArray);
  options.stage = stage;

  return factor(options);
};

// __Module Definition__
module.exports = function(options, protect) {
  const controller = this;
  const initial = express.Router();
  const controllerForStage = {
    initial,
    request: express.Router(),
    query: express.Router(),
    finalize: express.Router()
  };

  // §STAGE:
  protect.controllerForStage = controllerForStage;
  // __Stage Controllers__
  controller.use(initial);
  controller.use(controllerForStage.request);
  controller.use(controllerForStage.query);
  controller.use(controllerForStage.finalize);
  // Expose the original `use` function as a protected method.
  protect.use = controller.use.bind(controller);
  // Pass the method calls through to the "initial" stage middleware controller,
  // so that it precedes all other stages and middleware that might have been
  // already added.
  controller.use = initial.use.bind(initial);
  controller.all = initial.all.bind(initial);
  controller.head = initial.head.bind(initial);
  controller.get = initial.get.bind(initial);
  controller.post = initial.post.bind(initial);
  controller.put = initial.put.bind(initial);
  controller.delete = initial.delete.bind(initial);

  //  §ACTIVATION
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

  // §REQUEST
  // Build the "Allow" response header
  controller.request(function(request, response, next) {
    const active = ['head', 'get', 'post', 'put', 'delete'].filter(function(method) {
      return controller.methods(method) !== false;
    });
    const allowed = active.map(function(verb) {
      return verb.toUpperCase();
    });
    response.set('Allow', allowed.join());
    next();
  });

  const check = ['ObjectID', 'Number'];

  protect.isInvalid = function(id, instance, type) {
    if (!id) return false;
    if (check.indexOf(instance) === -1) return false;
    if (instance === 'ObjectID' && id.match(/^[a-f0-9]{24}$/i)) return false;
    if (instance === 'Number' && !isNaN(Number(id))) return false;
    return true;
  };

  // Validate URL's ID parameter, if any.
  controller.request(function(request, response, next) {
    const id = request.params.id;
    const instance = controller.model().schema.path(controller.findBy()).instance;
    const invalid = protect.isInvalid(request.params.id, instance, 'url.id');
    if (!invalid) return next();
    next(RestError.BadRequest('The requested document ID "%s" is not a valid document ID', id));
  });

  // Check that the HTTP method has not been disabled for this controller.
  controller.request(function(request, response, next) {
    const method = request.method.toLowerCase();
    if (controller.methods(method) !== false) return next();
    next(RestError.MethodNotAllowed('The requested method has been disabled for this resource'));
  });

  // Treat the addressed document as a collection, and push the addressed object
  // to it.  (Not implemented.)
  controller.request('instance', 'post', function(request, response, next) {
    return next(RestError.NotImplemented('Cannot POST to an instance'));
  });

  // Update all given docs.  (Not implemented.)
  controller.request('collection', 'put', function(request, response, next) {
    return next(RestError.NotImplemented('Cannot PUT to the collection'));
  });

  // // ※conditions
  // Set the conditions used for finding/updating/removing documents.
  this.request(function(request, response, next) {
    let conditions = request.query.conditions || {};

    if (typeof conditions === 'string') {
      try {
        conditions = JSON.parse(conditions);
      } catch (exception) {
        next(
          RestError.BadRequest(
            'The conditions query string value was not valid JSON: "%s"',
            exception.message
          )
        );
        return;
      }
    }

    if (conditions.$explain && !controller.explain()) {
      return next(RestError.BadRequest('Using $explain is disabled for this resource'));
    }

    if (request.params.id !== undefined) {
      conditions[controller.findBy()] = request.params.id;
    }

    request.baucis.conditions = conditions;
    next();
  });

  // ※ Stream
  // A utility method for ordering through streams.
  protect.pipeline = function(handler) {
    const streams = [];
    const d = domain.create();
    d.on('error', handler);
    return function(transmute) {
      // If it's a stream, add it to the reserve pipeline.
      if (transmute && (transmute.writable || transmute.readable)) {
        streams.push(transmute);
        d.add(transmute);
        return transmute;
      }
      // If it's a function, create a map stream with it.
      if (transmute) {
        transmute = eventStream.map(transmute);
        streams.push(transmute);
        d.add(transmute);
        return transmute;
      }
      // If called without arguments, return a pipeline linking all streams.
      if (streams.length > 0) {
        return d.run(function() {
          return eventStream.pipeline(...streams);
        });
      }
      // But, if no streams were added, just pass back a through stream.
      return d.run(eventStream.through);
    };
  };
  // __Middleware__
  // Create the pipeline interface the user interacts with.
  this.request(function(request, response, next) {
    request.baucis.incoming = protect.pipeline(next);
    request.baucis.outgoing = protect.pipeline(next);
    next();
  });
};
