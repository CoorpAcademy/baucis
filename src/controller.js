const util = require('util');
const crypto = require('crypto');
const domain = require('domain');
const deco = require('deco');
const express = require('express');
const RestError = require('rest-error');
const eventStream = require('event-stream');
const mongoose = require('mongoose');
const semver = require('semver');

const {
  isPositiveInteger,
  getAsInt,
  isNonNegativeInteger
} = require('./utils/predicates-and-accessors');
const {defineRoutes} = require('./utils/routing');

const Controller = deco(function(model, protect) {
  const controller = this;
  const initial = express.Router();
  const controllerForStage = {
    initial,
    request: express.Router(),
    query: express.Router(),
    finalize: express.Router()
  };

  // §CONFIGURE
  if (typeof model !== 'string' && (!model || !model.schema)) {
    throw RestError.Misconfigured('You must pass in a model or model name');
  }

  // __Property Definitions__
  protect.property('comments', false);
  protect.property('explain', false);
  protect.property('hints', false);
  protect.property('select', '');
  protect.property('sort', '');

  protect.property('versions', '*', function(range) {
    if (semver.validRange(range)) return range;
    throw RestError.Misconfigured(
      'Controller version range "%s" was not a valid semver range',
      range
    );
  });

  protect.property('model', undefined, function(m) {
    // TODO readonly
    if (typeof m === 'string') return mongoose.model(m);
    return m;
  });

  protect.property('fragment', function(value) {
    if (value === undefined) return `/${controller.model().plural()}`;
    if (value.indexOf('/') !== 0) return `/${value}`;
    return value;
  });

  protect.property('findBy', '_id', function(path) {
    const findByPath = controller.model().schema.path(path);
    if (
      !findByPath.options.unique &&
      !(findByPath.options.index && findByPath.options.index.unique)
    ) {
      throw RestError.Misconfigured(
        '`findBy` path for model "%s" must be unique',
        controller.model().modelName
      );
    }
    return path;
  });

  protect.multiproperty('operators', undefined, false);
  protect.multiproperty('methods', 'head get put post delete', true, function(enabled) {
    return !!enabled;
  });

  controller.deselected = function(path) {
    const deselected = controller.model().deselected();
    // Add deselected paths from the controller.
    controller
      .select()
      .split(/\s+/)
      .forEach(function(path) {
        const match = /^(?:[-]((?:[\w]|[-])+)\b)$/.exec(path);
        if (match) deselected.push(match[1]);
      });
    const deduplicated = deselected.filter(function(path, position) {
      return deselected.indexOf(path) === position;
    });

    if (arguments.length === 0) return deduplicated;
    else return deduplicated.indexOf(path) !== -1;
  };

  // Set the controller model.
  controller.model(model);

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

  //  §QUERY
  const baucis = require('..');

  // / create
  controller.query('post', function(request, response, next) {
    let url = request.originalUrl || request.url;
    const findBy = controller.findBy();
    const pipeline = protect.pipeline(next);
    let parser;
    // Add trailing slash to URL if needed.
    if (url.lastIndexOf('/') === url.length - 1) url = url.slice(0, url.length - 1);
    // Set the status to 201 (Created).
    response.status(201);
    // Check if the body was parsed by some external middleware e.g. `express.json`.
    // If so, create a stream from the POST'd document or documents.
    if (request.body) {
      pipeline(eventStream.readArray([].concat(request.body)));
    } else {
      // Otherwise, stream and parse the request.
      parser = baucis.parser(request.get('content-type'));
      if (!parser) return next(RestError.UnsupportedMediaType());
      pipeline(request);
      pipeline(parser);
    }
    // Create the stream context.
    pipeline(function(incoming, callback) {
      callback(null, {incoming, doc: null});
    });
    // Process the incoming document or documents.
    pipeline(request.baucis.incoming());
    // Map function to create a document from incoming JSON and update the context.
    pipeline(function(context, callback) {
      const transformed = {incoming: context.incoming};
      const Model = controller.model();
      const type = context.incoming.__t;
      const Discriminator = type ? Model.discriminators[type] : undefined;
      if (type && !Discriminator) {
        callback(
          RestError.UnprocessableEntity({
            message: "A document's type did not match any known discriminators for this resource",
            name: 'RestError',
            path: '__t',
            value: type
          })
        );
        return;
      }
      // Create the document using either the model or child model.
      if (type) transformed.doc = new Discriminator();
      else transformed.doc = new Model();
      // Transformation complete.
      callback(null, transformed);
    });
    // Update the new Mongoose document with the incoming data.
    pipeline(function(context, callback) {
      context.doc.set(context.incoming);
      callback(null, context);
    });
    // Save each document.
    pipeline(function(context, callback) {
      context.doc.save(function(error, doc) {
        if (error) return next(error);
        callback(null, {incoming: context.incoming, doc});
      });
    });
    // Map the saved documents to document IDs.
    pipeline(function(context, callback) {
      callback(null, context.doc.get(findBy));
    });
    // Write the IDs to an array and process them.
    const s = pipeline();
    s.pipe(
      eventStream.writeArray(function(error, ids) {
        if (error) return next(error);
        // URL location of newly created document or documents.
        let location;
        // Set the conditions used to build `request.baucis.query`.
        const conditions = {$in: ids};
        request.baucis.conditions[findBy] = conditions;
        // Check for at least one document.
        if (ids.length === 0) {
          next(
            RestError.UnprocessableEntity({
              message: 'The request body must contain at least one document',
              name: 'RestError'
            })
          );
          return;
        }
        // Set the `Location` header if at least one document was sent.
        if (ids.length === 1) location = `${url}/${ids[0]}`;
        else
          location = util.format(
            '%s?conditions={ "%s": %s }',
            url,
            findBy,
            JSON.stringify(conditions)
          );
        response.set('Location', location);
        next();
      })
    );
    s.resume();
  });

  // /※Update

  const validOperators = ['$set', '$push', '$pull', '$addToSet', '$pop', '$pushAll', '$pullAll'];

  function checkBadUpdateOperatorPaths(operator, paths) {
    let bad = false;
    const whitelisted = controller.operators(operator);

    if (!whitelisted) return true;

    const parts = whitelisted.split(/\s+/);

    paths.forEach(function(path) {
      if (parts.indexOf(path) !== -1) return;
      bad = true;
    });

    return bad;
  }

  // If there's a body, send it through any user-added streams.
  controller.query('instance', 'put', function(request, response, next) {
    let parser;
    let count = 0;
    const operator = request.headers['update-operator'];
    const versionKey = controller.model().schema.get('versionKey');
    const pipeline = protect.pipeline(next);
    // Check if the body was parsed by some external middleware e.g. `express.json`.
    // If so, create a one-document stream from the parsed body.
    if (request.body) {
      pipeline(eventStream.readArray([request.body]));
    } else {
      // Otherwise, stream and parse the request.
      parser = baucis.parser(request.get('content-type'));
      if (!parser) return next(RestError.UnsupportedMediaType());
      pipeline(request);
      pipeline(parser);
    }
    // Set up the stream context.
    pipeline(function(body, callback) {
      const context = {doc: undefined, incoming: body};
      callback(null, context);
    });
    // Load the Mongoose document and add it to the context, unless this is a
    // special update operator.
    if (!operator) {
      pipeline(function(context, callback) {
        const query = controller.model().findOne(request.baucis.conditions);
        query.exec(function(error, doc) {
          if (error) return callback(error);
          if (!doc) return callback(RestError.NotFound());
          // Add the Mongoose document to the context.
          callback(null, {doc, incoming: context.incoming});
        });
      });
    }
    // Pipe through user streams, if any.
    pipeline(request.baucis.incoming());
    // If the document ID is present, ensure it matches the ID in the URL.
    pipeline(function(context, callback) {
      const bodyId = context.incoming[controller.findBy()];
      if (bodyId === undefined) return callback(null, context);
      if (bodyId === request.params.id) return callback(null, context);
      callback(
        RestError.UnprocessableEntity({
          message: "The ID of the update document did not match the URL's document ID.",
          name: 'RestError',
          path: controller.findBy(),
          value: bodyId
        })
      );
    });
    // Ensure the request includes a finite object version if locking is enabled.
    if (controller.model().locking()) {
      pipeline(function(context, callback) {
        const updateVersion = context.incoming[versionKey];
        if (updateVersion === undefined || !Number.isFinite(Number(updateVersion))) {
          callback(
            RestError.UnprocessableEntity({
              message:
                'Locking is enabled, but the target version was not provided in the request body.',
              name: 'RestError',
              path: versionKey
            })
          );
          return;
        }
        callback(null, context);
      });
      // Add some locking checks only applicable to the default update operator.
      if (!operator) {
        // Make sure the version key was selected.
        pipeline(function(context, callback) {
          if (!context.doc.isSelected(versionKey)) {
            callback(RestError.BadRequest('The version key "%s" must be selected', versionKey));
            return;
          }
          // Pass through.
          callback(null, context);
        });
        pipeline(function(context, callback) {
          const updateVersion = Number(context.incoming[versionKey]);
          // Update and current version have been found.  Check if they're equal.
          if (updateVersion !== context.doc[versionKey]) return callback(RestError.LockConflict());
          // One is not allowed to set __v and increment in the same update.
          delete context.incoming[versionKey];
          context.doc.increment();
          // Pass through.
          callback(null, context);
        });
      }
    }
    // Ensure there is exactly one update document.
    pipeline(
      eventStream.through(
        function(context) {
          count += 1;
          if (count === 2) {
            this.emit(
              'error',
              RestError.UnprocessableEntity({
                message: 'The request body contained more than one update document',
                name: 'RestError'
              })
            );
            return;
          }
          if (count > 1) return;

          this.emit('data', context);
        },
        function() {
          if (count === 0) {
            this.emit(
              'error',
              RestError.UnprocessableEntity({
                message: 'The request body did not contain an update document',
                name: 'RestError'
              })
            );
            return;
          }
          this.emit('end');
        }
      )
    );
    // Finish up for the default update operator.
    if (!operator) {
      // Update the Mongoose document with the request body.
      pipeline(function(context, callback) {
        context.doc.set(context.incoming);
        // Pass through.
        callback(null, context);
      });
      // Save the Mongoose document.
      pipeline(function(context, callback) {
        context.doc.save(callback);
      });
    } else {
      // Finish up for a non-default update operator (bypasses validation).
      pipeline(function(context, callback) {
        const wrapper = {};

        if (validOperators.indexOf(operator) === -1) {
          callback(
            RestError.NotImplemented(
              'The requested update operator "%s" is not supported',
              operator
            )
          );
          return;
        }
        // Ensure that some paths have been enabled for the operator.
        if (!controller.operators(operator)) {
          callback(
            RestError.Forbidden(
              'The requested update operator "%s" is not enabled for this resource',
              operator
            )
          );
          return;
        }
        // Make sure paths have been whitelisted for this operator.
        if (checkBadUpdateOperatorPaths(operator, Object.keys(context.incoming))) {
          callback(
            RestError.Forbidden(
              'This update path is forbidden for the requested update operator "%s"',
              operator
            )
          );
          return;
        }

        wrapper[operator] = context.incoming;
        if (controller.model().locking()) {
          request.baucis.conditions[versionKey] = Number(context.incoming[versionKey]);
        }
        // Update the doc using the supplied operator and bypassing validation.
        controller.model().updateMany(request.baucis.conditions, wrapper, callback);
      });
    }

    const s = pipeline();
    s.on('end', next);
    s.resume();
  });

  // / ※Build
  controller.query('collection', '*', function(request, response, next) {
    request.baucis.query = controller.model().find(request.baucis.conditions);
    next();
  });

  controller.query('instance', '*', function(request, response, next) {
    request.baucis.query = controller.model().findOne(request.baucis.conditions);
    next();
  });

  // / ※Options
  function checkBadSelection(select) {
    let bad = false;
    controller.deselected().forEach(function(path) {
      const badPath = new RegExp(`[+]?${path}\\b`, 'i');
      if (badPath.exec(select)) bad = true;
    });
    return bad;
  }

  // Perform distinct query.
  this.query(function(request, response, next) {
    const distinct = request.query.distinct;
    if (!distinct) return next();
    if (controller.deselected(distinct)) {
      next(RestError.Forbidden('You may not find distinct values for the requested path'));
      return;
    }
    const query = controller.model().distinct(distinct, request.baucis.conditions);
    query.exec(function(error, values) {
      if (error) return next(error);
      request.baucis.documents = values;
      next();
    });
  });
  // Apply controller sort options to the query.
  this.query(function(request, response, next) {
    const sort = controller.sort();
    if (sort) request.baucis.query.sort(sort);
    next();
  });
  // Apply incoming request sort.
  this.query(function(request, response, next) {
    const sort = request.query.sort;
    if (sort) request.baucis.query.sort(sort);
    next();
  });
  // Apply controller select options to the query.
  this.query(function(request, response, next) {
    const select = controller.select();
    if (select) request.baucis.query.select(select);
    next();
  });
  // Apply incoming request select to the query.
  this.query(function(request, response, next) {
    const select = request.query.select;
    if (!select) return next();

    if (select.indexOf('+') !== -1) {
      return next(RestError.Forbidden('Including excluded fields is not permitted'));
    }
    if (checkBadSelection(select)) {
      return next(RestError.Forbidden('Including excluded fields is not permitted'));
    }

    request.baucis.query.select(select);
    next();
  });
  // Apply incoming request populate.
  this.query(function(request, response, next) {
    let populate = request.query.populate;
    const allowPopulateSelect = request.baucis.allowPopulateSelect;
    let error = null;

    if (populate) {
      if (typeof populate === 'string') {
        if (populate.indexOf('{') !== -1) populate = JSON.parse(populate);
        else if (populate.indexOf('[') !== -1) populate = JSON.parse(populate);
      }

      if (!Array.isArray(populate)) populate = [populate];

      populate.forEach(function(field) {
        if (error) return;
        if (checkBadSelection(field.path || field)) {
          return (error = RestError.Forbidden('Including excluded fields is not permitted'));
        }
        // Don't allow selecting fields from client when populating
        if (field.select) {
          if (!allowPopulateSelect)
            return (error = RestError.Forbidden(
              'Selecting fields of populated documents is not permitted'
            ));
          console.warn(
            'WARNING: Allowing populate with select is experimental and bypasses security.'
          );
        }

        request.baucis.query.populate(field);
      });
    }

    next(error);
  });
  // Apply incoming request skip.
  this.query(function(request, response, next) {
    const skip = request.query.skip;
    if (skip === undefined || skip === null) return next();
    if (!isNonNegativeInteger(skip)) {
      return next(RestError.BadRequest('Skip must be a non-negative integer if set'));
    }
    request.baucis.query.skip(getAsInt(skip));
    next();
  });
  // Apply incoming request limit.
  this.query(function(request, response, next) {
    const limit = request.query.limit;
    if (limit === undefined || limit === null) return next();
    if (!isPositiveInteger(limit)) {
      return next(RestError.BadRequest('Limit must be a positive integer if set'));
    }
    request.baucis.query.limit(getAsInt(limit));
    next();
  });
  // Set count flag.
  this.query(function(request, response, next) {
    if (!request.query.count) return next();
    if (request.query.count === 'false') return next();
    if (request.query.count !== 'true') {
      next(RestError.BadRequest('Count must be "true" or "false" if set'));
      return;
    }

    if (request.query.hint) {
      next(RestError.BadRequest("Hint can't be used with count"));
      return;
    }

    if (request.query.comment) {
      next(RestError.BadRequest("Comment can't be used with count"));
      return;
    }

    request.baucis.count = true;
    next();
  });
  // Check for query comment.
  this.query(function(request, response, next) {
    const comment = request.query.comment;
    if (!comment) return next();
    if (controller.comments()) request.baucis.query.comment(comment);
    else console.warn('Query comment was ignored.');
    next();
  });
  // Check for query hint.
  this.query(function(request, response, next) {
    let hint = request.query.hint;

    if (!hint) return next();
    if (!controller.hints()) {
      return next(RestError.Forbidden('Hints are not enabled for this resource'));
    }

    if (typeof hint === 'string') hint = JSON.parse(hint);
    // Convert the value for each path from string to number.
    Object.keys(hint).forEach(function(path) {
      hint[path] = Number(hint[path]);
    });
    request.baucis.query.hint(hint);

    next();
  });

  // / §SEND
  const lastModifiedPath = controller.model().lastModified();
  const trailers = {};

  // __Private Module Members__
  // Format the Trailer header.
  function addTrailer(response, header) {
    const current = response.get('Trailer');
    if (!current) response.set('Trailer', header);
    else response.set('Trailer', `${current}, ${header}`);
  }
  // A map that is used to create empty response body.
  function empty(context, callback) {
    callback(null, '');
  }
  // Map contexts back into documents.
  function redoc(context, callback) {
    callback(null, context.doc);
  }
  // Generate a respone Etag from a context.
  function etag(response, useTrailer) {
    if (useTrailer) {
      addTrailer(response, 'Etag');
      response.set('Transfer-Encoding', 'chunked');
    }

    const hash = crypto.createHash('md5');

    return eventStream.through(
      function(chunk) {
        hash.update(chunk);
        this.emit('data', chunk);
      },
      function() {
        if (useTrailer) {
          trailers.Etag = `"${hash.digest('hex')}"`;
        } else {
          response.set('Etag', `"${hash.digest('hex')}"`);
        }

        this.emit('end');
      }
    );
  }

  function etagImmediate(response) {
    const hash = crypto.createHash('md5');

    return eventStream.through(
      function(chunk) {
        hash.update(JSON.stringify(chunk));
        response.set('Etag', `"${hash.digest('hex')}"`);
        this.emit('data', chunk);
      },
      function() {
        this.emit('end');
      }
    );
  }
  // Generate a Last-Modified header/trailer
  function lastModified(response, useTrailer) {
    if (useTrailer) {
      addTrailer(response, 'Last-Modified');
      response.set('Transfer-Encoding', 'chunked');
    }

    let latest = null;

    return eventStream.through(
      function(context) {
        if (!context) return;
        if (!context.doc) return this.emit('data', context);
        if (!context.doc.get) return this.emit('data', context);

        const current = context.doc.get(lastModifiedPath);
        if (latest === null) latest = current;
        else latest = new Date(Math.max(latest, current));
        if (!useTrailer) {
          response.set('Last-Modified', latest.toUTCString());
        }
        this.emit('data', context);
      },
      function() {
        if (useTrailer) {
          if (latest) trailers['Last-Modified'] = latest.toUTCString();
        }

        this.emit('end');
      }
    );
  }

  // Build a reduce stream.
  function reduce(accumulated, f) {
    return eventStream.through(
      function(context) {
        accumulated = f(accumulated, context);
      },
      function() {
        this.emit('data', accumulated);
        this.emit('end');
      }
    );
  }
  // Count emissions.
  function count() {
    return reduce(0, function(a, b) {
      return a + 1;
    });
  }

  // If counting get the count and send it back directly.
  protect.finalize(function(request, response, next) {
    if (!request.baucis.count) return next();

    request.baucis.query.count(function(error, n) {
      if (error) return next(error);
      response.removeHeader('Transfer-Encoding');
      return response.json(n); // TODO support other content types
    });
  });

  // If not counting, create the basic stream pipeline.
  protect.finalize('collection', 'all', function(request, response, next) {
    let count = 0;
    const documents = request.baucis.documents;
    const pipeline = protect.pipeline(next);
    request.baucis.send = pipeline;
    // If documents were set in the baucis hash, use them.
    if (documents) pipeline(eventStream.readArray([].concat(documents)));
    else {
      // Otherwise, stream the relevant documents from Mongo, based on constructed query.
      pipeline(request.baucis.query.cursor());
    }

    // Map documents to contexts.
    pipeline(function(doc, callback) {
      callback(null, {doc, incoming: null});
    });
    // Check for not found.
    pipeline(
      eventStream.through(
        function(context) {
          count += 1;
          this.emit('data', context);
        },
        function() {
          if (count > 0) return this.emit('end');

          const status = controller.emptyCollection();
          response.status(status);

          if (status === 204) {
            response.removeHeader('Trailer');
            return this.emit('end');
          }
          if (status === 200) {
            response.removeHeader('Transfer-Encoding');
            response.removeHeader('Trailer');
            response.json([]); // TODO other content types
            this.emit('end');
            return;
          }

          this.emit('error', RestError.NotFound());
        }
      )
    );
    // Apply user streams.
    pipeline(request.baucis.outgoing());

    // Set the document formatter based on the Accept header of the request.
    baucis.formatters(response, function(error, formatter) {
      if (error) return next(error);
      request.baucis.formatter = formatter;
      next();
    });
  });

  protect.finalize('instance', 'all', function(request, response, next) {
    let count = 0;
    const documents = request.baucis.documents;
    const pipeline = protect.pipeline(next);
    request.baucis.send = pipeline;
    // If documents were set in the baucis hash, use them.
    if (documents) {
      pipeline(eventStream.readArray([].concat(documents)));
    } else {
      // Otherwise, stream the relevant documents from Mongo, based on constructed query.
      pipeline(request.baucis.query.cursor());
    }

    // Map documents to contexts.
    pipeline(function(doc, callback) {
      callback(null, {doc, incoming: null});
    });
    // Check for not found.
    pipeline(
      eventStream.through(
        function(context) {
          count += 1;
          this.emit('data', context);
        },
        function() {
          if (count > 0) return this.emit('end');
          this.emit('error', RestError.NotFound());
        }
      )
    );
    // Apply user streams.
    pipeline(request.baucis.outgoing());

    // Set the document formatter based on the Accept header of the request.
    baucis.formatters(response, function(error, formatter) {
      if (error) return next(error);
      request.baucis.formatter = formatter;
      next();
    });
  });

  // OPTIONS // TODO Express' extra handling for OPTIONS conflicts with baucis
  // TODO maybe send method names in body
  // controller.options(function (request, response, next) {
  //   console.log('here')
  //   request.baucis.send(empty);
  //   next();
  // });

  // HEAD
  protect.finalize('instance', 'head', function(request, response, next) {
    if (lastModifiedPath) {
      request.baucis.send(lastModified(response, false));
    }

    request.baucis.send(redoc);
    request.baucis.send(etagImmediate(response));
    request.baucis.send(request.baucis.formatter());
    request.baucis.send(empty);
    next();
  });

  protect.finalize('collection', 'head', function(request, response, next) {
    if (lastModifiedPath) {
      request.baucis.send(lastModified(response, false));
    }

    request.baucis.send(redoc);
    request.baucis.send(request.baucis.formatter(true));
    request.baucis.send(etag(response, false));
    request.baucis.send(empty);
    next();
  });

  // GET
  protect.finalize('instance', 'get', function(request, response, next) {
    if (lastModifiedPath) {
      request.baucis.send(lastModified(response, false));
    }

    request.baucis.send(redoc);
    request.baucis.send(etagImmediate(response));
    request.baucis.send(request.baucis.formatter());
    next();
  });

  protect.finalize('collection', 'get', function(request, response, next) {
    if (lastModifiedPath) {
      request.baucis.send(lastModified(response, true));
    }

    if (request.baucis.count) {
      request.baucis.send(count());
      request.baucis.send(eventStream.stringify());
    } else {
      request.baucis.send(redoc);
      request.baucis.send(request.baucis.formatter(true));
    }

    request.baucis.send(etag(response, true));
    next();
  });

  // POST
  protect.finalize('collection', 'post', function(request, response, next) {
    request.baucis.send(redoc);
    request.baucis.send(request.baucis.formatter());
    next();
  });

  // PUT
  protect.finalize('put', function(request, response, next) {
    request.baucis.send(redoc);
    request.baucis.send(request.baucis.formatter());
    next();
  });

  // DELETE
  protect.finalize('delete', function(request, response, next) {
    // Remove each document from the database.
    request.baucis.send(function(context, callback) {
      context.doc.remove(callback);
    });
    // Respond with the count of deleted documents.
    request.baucis.send(count());
    request.baucis.send(eventStream.stringify());
    next();
  });

  protect.finalize(function(request, response, next) {
    request.baucis.send().pipe(
      eventStream.through(
        function(chunk) {
          response.write(chunk);
        },
        function() {
          response.addTrailers(trailers);
          response.end();
          this.emit('end');
        }
      )
    );
  });

  // §errors
  protect.property('emptyCollection', 200);
  // A controller property that sets whether errors should be
  // handled if possible, or just set status code.
  protect.property('handleErrors', true, function(handle) {
    return !!handle;
  });
  // If it's a Mongo bad hint error, convert to a bad request error.
  protect.use(function(error, request, response, next) {
    if (!error) return next();
    if (!error.message) return next(error);

    const message = 'The requested query hint is invalid';
    // Bad Mongo query hint (2.x).
    if (error.message === 'bad hint') {
      next(RestError.BadRequest(message));
      return;
    }
    // Bad Mongo query hint (3.x).
    if (error.message.match('planner returned error: bad hint')) {
      next(RestError.BadRequest(message));
      return;
    }
    if (!error.$err) return next(error);
    // Mongoose 3
    if (error.$err.match('planner returned error: bad hint')) {
      next(RestError.BadRequest(message));
      return;
    }
    next(error);
  });
  // Convert Mongo duplicate key error to an unprocessible entity error
  protect.use(function(error, request, response, next) {
    if (!error) return next();
    if (!error.message) return next(error);
    if (error.message.indexOf('E11000 duplicate key error') === -1) {
      next(error);
      return;
    }

    const body = {};
    const scrape = /(?:[$]|index: )(.+)[_]\d+\s+dup key: [{] : "([^"]+)" [}]/;

    const scraped = scrape.exec(error.message);
    const path = scraped ? scraped[1] : '???';
    const value = scraped ? scraped[2] : '???';
    body[path] = {
      message: util.format('Path `%s` (%s) must be unique.', path, value),
      originalMessage: error.message,
      name: 'MongoError',
      path,
      type: 'unique',
      value
    };

    const translatedError = RestError.UnprocessableEntity();
    translatedError.errors = body;

    next(translatedError);
  });
  // Convert Mongo validation errors to unprocessable entity errors.
  protect.use(function(error, request, response, next) {
    if (!error) return next();
    if (!(error instanceof mongoose.Error.ValidationError)) return next(error);
    const newError = RestError.UnprocessableEntity();
    newError.errors = error.errors;
    next(newError);
  });
  // Convert Mongoose version conflict error to LockConflict.
  protect.use(function(error, request, response, next) {
    if (!error) return next();
    if (!(error instanceof mongoose.Error.VersionError)) return next(error);
    next(RestError.LockConflict());
  });
  // Translate other errors to internal server errors.
  protect.use(function(error, request, response, next) {
    if (!error) return next();
    if (error instanceof RestError) return next(error);
    const error2 = RestError.InternalServerError(error.message);
    error2.stack = error.stack;
    next(error2);
  });
  // Format the error based on the Accept header.
  protect.use(function(error, request, response, next) {
    if (!error) return next();

    // Always set the status code if available.
    if (error.status >= 100) {
      response.status(error.status);
    }

    if (!controller.handleErrors()) return next(error);

    baucis.formatters(response, function(error2, formatter) {
      if (error2) return next(error2);

      let errors;

      if (!error.errors) {
        errors = [error];
      } else if (Array.isArray(error.errors) && error.errors.length !== 0) {
        errors = error.errors;
      } else {
        errors = Object.keys(error.errors).map(function(key) {
          return error.errors[key];
        });
      }

      if (errors.length === 0) {
        errors = [error];
      }

      errors = errors.map(function(error3) {
        const o = {};
        Object.getOwnPropertyNames(error3).forEach(function(key) {
          o[key] = error3[key];
        });
        delete o.domain;
        delete o.domainEmitter;
        delete o.domainThrown;
        return o;
      });

      // TODO deprecated -- always send as single error in 2.0.0
      const f = formatter(error instanceof RestError.UnprocessableEntity);
      f.on('error', next);

      eventStream
        .readArray(errors)
        .pipe(f)
        .pipe(response);
    });
  });
});
Controller.factory(express.Router);

module.exports = Controller;
