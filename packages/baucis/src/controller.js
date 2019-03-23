const util = require('util');
const crypto = require('crypto');
const domain = require('domain');
const RestError = require('rest-error');
const eventStream = require('event-stream');
const semver = require('semver');

const {
  isPositiveInteger,
  getAsInt,
  isNonNegativeInteger
} = require('./utils/predicates-and-accessors');
const {defineRoutes} = require('./utils/routing');

module.exports = function(baucis, mongoose, express) {
  /**
   * Returns a Baucis Controller for the given model
   *
   * the controller is an express router
   *
   * @param {*} model Mongoose model
   */
  const getController = function(model) {
    const controller = express.Router(arguments);
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

    // §FIXME: in a second time use real getter
    controller._comments = false;
    controller.comments = function(value) {
      if (arguments.length === 1) {
        controller._comments = value;
        return controller;
      } else {
        return controller._comments;
      }
    };
    controller._explain = false;
    controller.explain = function(value) {
      if (arguments.length === 1) {
        controller._explain = value;
        return controller;
      } else {
        return controller._explain;
      }
    };
    controller._hints = false;
    controller.hints = function(value) {
      if (arguments.length === 1) {
        controller._hints = value;
        return controller;
      } else {
        return controller._hints;
      }
    };
    controller._select = '';
    controller.select = function(value) {
      if (arguments.length === 1) {
        controller._select = value;
        return controller;
      } else {
        return controller._select;
      }
    };
    controller._sort = '';
    controller.sort = function(value) {
      if (arguments.length === 1) {
        controller._sort = value;
        return controller;
      } else {
        return controller._sort;
      }
    };

    controller._versions = '*';
    controller.versions = function(range) {
      if (arguments.length === 1) {
        if (!semver.validRange(range))
          throw RestError.Misconfigured(
            `Controller version range "${range}" was not a valid semver range`
          );
        controller._versions = range;
        return controller;
      } else {
        return controller._versions;
      }
    };
    controller._model = undefined;
    controller.model = function(m) {
      if (arguments.length === 1) {
        controller._model = typeof m === 'string' ? mongoose.model(m) : m;
        return controller;
      } else {
        return controller._model;
      }
    };
    controller._fragment = undefined;
    controller.fragment = function(value) {
      if (arguments.length === 1) {
        controller._fragment = !value.startsWith('/') ? `/${value}` : value;
        return controller;
      } else {
        return controller._fragment || `/${controller.model().plural()}`;
      }
    };

    controller._findBy = '_id';
    controller.findBy = function(path) {
      if (arguments.length === 1) {
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
        controller._findBy = path;
        return controller;
      } else {
        return controller._findBy;
      }
    };

    controller._operators = {};
    controller.operators = function(items, cargo) {
      if (arguments.length === 0) {
        return Object.keys(controller._operators).filter(item => controller._operators[item]);
      } else if (arguments.length === 1) {
        if (items.match(/\s/)) throw new Error('Can only specify one item when getting');
        return controller._operators[items];
      } else {
        items
          .split(/\s+/g)
          .filter(id => id) // FIXME LODASH
          .forEach(function(item) {
            controller._operators[item] = cargo;
          });
        return controller;
      }
    };

    controller._methods = {head: true, get: true, put: true, post: true, delete: true};
    controller.methods = function(items, cargo) {
      if (arguments.length === 0) {
        return Object.keys(controller._methods).filter(item => controller._methods[item]);
      } else if (arguments.length === 1) {
        if (items.match(/\s/)) throw new Error('Can only specify one item when getting');
        return controller._methods[items];
      } else {
        items
          .split(/\s+/g)
          .filter(id => id) // FIXME LODASH
          .forEach(function(item) {
            controller._methods[item] = !!cargo;
          });
        return controller;
      }
    };

    controller._emptyCollection = 200;
    controller.emptyCollection = function(value) {
      if (arguments.length === 1) {
        controller._emptyCollection = value;
        return controller;
      } else {
        return controller._emptyCollection;
      }
    };
    controller._handleErrors = true;
    /**
     * A controller property that sets whether errors should be
     * handled if possible, or just set status code.
     */
    controller.handleErrors = function(value) {
      if (arguments.length === 1) {
        controller._handleErrors = !!value;
        return controller;
      } else {
        return controller._handleErrors;
      }
    };

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
    controller.controllerForStage = controllerForStage;
    controller.use(initial);
    controller.use(controllerForStage.request);
    controller.use(controllerForStage.query);
    controller.use(controllerForStage.finalize);
    // Expose the original `use` function as a 'protected method'
    controller._use = controller.use.bind(controller);

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
    /**
     * A method used to activate middleware for a particular stage.
     */

    function activate(definition) {
      const stage = controller.controllerForStage[definition.stage];
      const f = stage[definition.method].bind(stage);
      if (definition.endpoint === 'instance') f('/:id', definition.middleware);
      else f('/', definition.middleware);
    }
    controller.finalize = function(endpoint, methods, middleware) {
      defineRoutes('finalize', arguments).forEach(activate);
      return controller;
    };

    /**
     * A method used to activate request-stage middleware.
     */
    controller.request = function(endpoint, methods, middleware) {
      defineRoutes('request', arguments).forEach(activate);
      return controller;
    };
    /**
     * A method used to activate query-stage middleware.
     */
    controller.query = function(endpoint, methods, middleware) {
      defineRoutes('query', arguments).forEach(activate);
      return controller;
    };

    // §REQUEST
    // Build the "Allow" response header
    controller.request(function(req, res, next) {
      const active = ['head', 'get', 'post', 'put', 'delete'].filter(
        method => controller.methods(method) !== false
      );
      const allowed = active.map(verb => verb.toUpperCase());
      res.set('Allow', allowed.join());
      next();
    });

    const check = ['ObjectID', 'Number'];

    controller.isInvalid = function(id, instance, type) {
      if (!id) return false;
      if (check.indexOf(instance) === -1) return false;
      if (instance === 'ObjectID' && id.match(/^[a-f0-9]{24}$/i)) return false;
      if (instance === 'Number' && !isNaN(Number(id))) return false;
      return true;
    };

    // Validate URL's ID parameter, if any.
    controller.request(function(req, res, next) {
      const id = req.params.id;
      const instance = controller.model().schema.path(controller.findBy()).instance;
      const invalid = controller.isInvalid(req.params.id, instance, 'url.id');
      if (!invalid) return next();
      next(RestError.BadRequest('The requested document ID "%s" is not a valid document ID', id));
    });

    // Check that the HTTP method has not been disabled for this controller.
    controller.request(function(req, res, next) {
      const method = req.method.toLowerCase();
      if (controller.methods(method) !== false) return next();
      next(RestError.MethodNotAllowed('The requested method has been disabled for this resource'));
    });

    /**
     *   Treat the addressed document as a collection, and push the addressed object
     * to it.  (Not implemented.)
     */
    controller.request('instance', 'post', function(req, res, next) {
      return next(RestError.NotImplemented('Cannot POST to an instance'));
    });

    /**
     * Update all given docs.  (Not implemented.)
     */
    controller.request('collection', 'put', function(req, res, next) {
      return next(RestError.NotImplemented('Cannot PUT to the collection'));
    });

    // / ※conditions
    /**
     *  Set the conditions used for finding/updating/removing documents.
     */
    controller.request(function(req, res, next) {
      let conditions = req.query.conditions || {};

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

      if (req.params.id !== undefined) {
        conditions[controller.findBy()] = req.params.id;
      }

      req.baucis.conditions = conditions;
      next();
    });

    // ※ Stream
    /**
     * A utility method for ordering through streams.
     */
    controller.pipeline = function(handler) {
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
    // Create the pipeline interface the user interacts with.
    controller.request(function(req, res, next) {
      req.baucis.incoming = controller.pipeline(next);
      req.baucis.outgoing = controller.pipeline(next);
      next();
    });

    //  §QUERY
    // / create
    controller.query('post', function(req, res, next) {
      let url = req.originalUrl || req.url;
      const findBy = controller.findBy();
      const pipeline = controller.pipeline(next);
      let parser;
      // Add trailing slash to URL if needed.
      if (url.lastIndexOf('/') === url.length - 1) url = url.slice(0, url.length - 1);
      // Set the status to 201 (Created).
      res.status(201);
      // Check if the body was parsed by some external middleware e.g. `express.json`.
      // If so, create a stream from the POST'd document or documents.
      if (req.body) {
        pipeline(eventStream.readArray([].concat(req.body)));
      } else {
        // Otherwise, stream and parse the request.
        parser = baucis.parser(req.get('content-type'));
        if (!parser) return next(RestError.UnsupportedMediaType());
        pipeline(req);
        pipeline(parser);
      }
      // Create the stream context.
      pipeline(function(incoming, callback) {
        callback(null, {incoming, doc: null});
      });
      // Process the incoming document or documents.
      pipeline(req.baucis.incoming());
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
          req.baucis.conditions[findBy] = conditions;
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
          res.set('Location', location);
          next();
        })
      );
      s.resume();
    });

    // /※Update
    const validOperators = ['$set', '$push', '$pull', '$addToSet', '$pop', '$pushAll', '$pullAll'];
    // §todo: maybe make it configurable

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
    controller.query('instance', 'put', function(req, res, next) {
      let parser;
      let count = 0;
      const operator = req.headers['update-operator'];
      const versionKey = controller.model().schema.get('versionKey');
      const pipeline = controller.pipeline(next);
      // Check if the body was parsed by some external middleware e.g. `express.json`.
      // If so, create a one-document stream from the parsed body.
      if (req.body) {
        pipeline(eventStream.readArray([req.body]));
      } else {
        // Otherwise, stream and parse the request.
        parser = baucis.parser(req.get('content-type'));
        if (!parser) return next(RestError.UnsupportedMediaType());
        pipeline(req);
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
          const query = controller.model().findOne(req.baucis.conditions);
          query.exec(function(error, doc) {
            if (error) return callback(error);
            if (!doc) return callback(RestError.NotFound());
            // Add the Mongoose document to the context.
            callback(null, {doc, incoming: context.incoming});
          });
        });
      }
      // Pipe through user streams, if any.
      pipeline(req.baucis.incoming());
      // If the document ID is present, ensure it matches the ID in the URL.
      pipeline(function(context, callback) {
        const bodyId = context.incoming[controller.findBy()];
        if (bodyId === undefined) return callback(null, context);
        if (bodyId === req.params.id) return callback(null, context);
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
            if (updateVersion !== context.doc[versionKey])
              return callback(RestError.LockConflict());
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
            req.baucis.conditions[versionKey] = Number(context.incoming[versionKey]);
          }
          // Update the doc using the supplied operator and bypassing validation.
          controller.model().updateMany(req.baucis.conditions, wrapper, callback);
        });
      }

      const s = pipeline();
      s.on('end', next);
      s.resume();
    });

    // / ※Build
    controller.query('collection', '*', function(req, res, next) {
      req.baucis.query = controller.model().find(req.baucis.conditions);
      next();
    });

    controller.query('instance', '*', function(req, res, next) {
      req.baucis.query = controller.model().findOne(req.baucis.conditions);
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
    controller.query(function(req, res, next) {
      const distinct = req.query.distinct;
      if (!distinct) return next();
      if (controller.deselected(distinct)) {
        next(RestError.Forbidden('You may not find distinct values for the requested path'));
        return;
      }
      const query = controller.model().distinct(distinct, req.baucis.conditions);
      query.exec(function(error, values) {
        if (error) return next(error);
        req.baucis.documents = values;
        next();
      });
    });
    // Apply controller sort options to the query.
    controller.query(function(req, res, next) {
      const sort = controller.sort();
      if (sort) req.baucis.query.sort(sort);
      next();
    });
    // Apply incoming request sort.
    controller.query(function(req, res, next) {
      // §TODO: maybe name the middleware for simpler debugging
      const sort = req.query.sort;
      if (sort) req.baucis.query.sort(sort);
      next();
    });
    // Apply controller select options to the query.
    controller.query(function(req, res, next) {
      const select = controller.select();
      if (select) req.baucis.query.select(select);
      next();
    });
    // Apply incoming request select to the query.
    controller.query(function(req, res, next) {
      const select = req.query.select;
      if (!select) return next();

      if (select.indexOf('+') !== -1) {
        return next(RestError.Forbidden('Including excluded fields is not permitted'));
      }
      if (checkBadSelection(select)) {
        return next(RestError.Forbidden('Including excluded fields is not permitted'));
      }

      req.baucis.query.select(select);
      next();
    });
    // Apply incoming request populate.
    controller.query(function(req, res, next) {
      let populate = req.query.populate;
      const allowPopulateSelect = req.baucis.allowPopulateSelect;
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

          req.baucis.query.populate(field);
        });
      }

      next(error);
    });
    // Apply incoming request skip.
    controller.query(function(req, res, next) {
      const skip = req.query.skip;
      if (skip === undefined || skip === null) return next();
      if (!isNonNegativeInteger(skip)) {
        return next(RestError.BadRequest('Skip must be a non-negative integer if set'));
      }
      req.baucis.query.skip(getAsInt(skip));
      next();
    });
    // Apply incoming request limit.
    controller.query(function(req, res, next) {
      const limit = req.query.limit;
      if (limit === undefined || limit === null) return next();
      if (!isPositiveInteger(limit)) {
        return next(RestError.BadRequest('Limit must be a positive integer if set'));
      }
      req.baucis.query.limit(getAsInt(limit));
      next();
    });
    // Set count flag.
    controller.query(function(req, res, next) {
      if (!req.query.count) return next();
      if (req.query.count === 'false') return next();
      if (req.query.count !== 'true') {
        next(RestError.BadRequest('Count must be "true" or "false" if set'));
        return;
      }

      if (req.query.hint) {
        next(RestError.BadRequest("Hint can't be used with count"));
        return;
      }

      if (req.query.comment) {
        next(RestError.BadRequest("Comment can't be used with count"));
        return;
      }

      req.baucis.count = true;
      next();
    });
    // Check for query comment.
    controller.query(function(req, res, next) {
      const comment = req.query.comment;
      if (!comment) return next();
      if (controller.comments()) req.baucis.query.comment(comment);
      else console.warn('Query comment was ignored.');
      next();
    });
    // Check for query hint.
    controller.query(function(req, res, next) {
      let hint = req.query.hint;

      if (!hint) return next();
      if (!controller.hints()) {
        return next(RestError.Forbidden('Hints are not enabled for this resource'));
      }

      if (typeof hint === 'string') hint = JSON.parse(hint);
      // Convert the value for each path from string to number.
      Object.keys(hint).forEach(function(path) {
        hint[path] = Number(hint[path]);
      });
      req.baucis.query.hint(hint);

      next();
    });

    // / §SEND
    const lastModifiedPath = controller.model().lastModified();
    const trailers = {};

    /**
     *  Format the Trailer header.
     */
    function addTrailer(response, header) {
      const current = response.get('Trailer');
      if (!current) response.set('Trailer', header);
      else response.set('Trailer', `${current}, ${header}`);
    }
    /**
     * A map that is used to create empty response body.
     */
    function empty(context, callback) {
      callback(null, '');
    }
    /**
     * Map contexts back into documents.
     */
    function redoc(context, callback) {
      callback(null, context.doc);
    }
    /**
     * Generate a respone Etag from a context.
     */
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
    /**
     * Generate a Last-Modified header/trailer
     */
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

    /**
     * Build a reduce stream.
     */
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
    /**
     * Count emissions.
     */
    function count() {
      return reduce(0, function(a, b) {
        return a + 1;
      });
    }

    // If counting get the count and send it back directly.
    controller.finalize(function(req, res, next) {
      if (!req.baucis.count) return next();

      req.baucis.query.count(function(error, n) {
        if (error) return next(error);
        res.removeHeader('Transfer-Encoding');
        return res.json(n); // TODO support other content types
      });
    });

    // If not counting, create the basic stream pipeline.
    controller.finalize('collection', 'all', function(req, res, next) {
      let count = 0;
      const documents = req.baucis.documents;
      const pipeline = controller.pipeline(next);
      req.baucis.send = pipeline;
      // If documents were set in the baucis hash, use them.
      if (documents) pipeline(eventStream.readArray([].concat(documents)));
      else {
        // Otherwise, stream the relevant documents from Mongo, based on constructed query.
        pipeline(req.baucis.query.cursor());
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
            res.status(status);

            if (status === 204) {
              res.removeHeader('Trailer');
              return this.emit('end');
            }
            if (status === 200) {
              res.removeHeader('Transfer-Encoding');
              res.removeHeader('Trailer');
              res.json([]); // TODO other content types
              this.emit('end');
              return;
            }

            this.emit('error', RestError.NotFound());
          }
        )
      );
      // Apply user streams.
      pipeline(req.baucis.outgoing());

      // Set the document formatter based on the Accept header of the request.
      baucis.formatters(res, function(error, formatter) {
        if (error) return next(error);
        req.baucis.formatter = formatter;
        next();
      });
    });

    controller.finalize('instance', 'all', function(req, res, next) {
      let count = 0;
      const documents = req.baucis.documents;
      const pipeline = controller.pipeline(next);
      req.baucis.send = pipeline;
      // If documents were set in the baucis hash, use them.
      if (documents) {
        pipeline(eventStream.readArray([].concat(documents)));
      } else {
        // Otherwise, stream the relevant documents from Mongo, based on constructed query.
        pipeline(req.baucis.query.cursor());
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
      pipeline(req.baucis.outgoing());

      // Set the document formatter based on the Accept header of the request.
      baucis.formatters(res, function(error, formatter) {
        if (error) return next(error);
        req.baucis.formatter = formatter;
        next();
      });
    });

    // OPTIONS // TODO Express' extra handling for OPTIONS conflicts with baucis
    // TODO maybe send method names in body
    // controller.options(function (req, res, next) {
    //   console.log('here')
    //   req.baucis.send(empty);
    //   next();
    // });

    // HEAD
    controller.finalize('instance', 'head', function(req, res, next) {
      if (lastModifiedPath) {
        req.baucis.send(lastModified(res, false));
      }

      req.baucis.send(redoc);
      req.baucis.send(etagImmediate(res));
      req.baucis.send(req.baucis.formatter());
      req.baucis.send(empty);
      next();
    });

    controller.finalize('collection', 'head', function(req, res, next) {
      if (lastModifiedPath) {
        req.baucis.send(lastModified(res, false));
      }

      req.baucis.send(redoc);
      req.baucis.send(req.baucis.formatter(true));
      req.baucis.send(etag(res, false));
      req.baucis.send(empty);
      next();
    });

    // GET
    controller.finalize('instance', 'get', function(req, res, next) {
      if (lastModifiedPath) {
        req.baucis.send(lastModified(res, false));
      }

      req.baucis.send(redoc);
      req.baucis.send(etagImmediate(res));
      req.baucis.send(req.baucis.formatter());
      next();
    });

    controller.finalize('collection', 'get', function(req, res, next) {
      if (lastModifiedPath) {
        req.baucis.send(lastModified(res, true));
      }

      if (req.baucis.count) {
        req.baucis.send(count());
        req.baucis.send(eventStream.stringify());
      } else {
        req.baucis.send(redoc);
        req.baucis.send(req.baucis.formatter(true));
      }

      req.baucis.send(etag(res, true));
      next();
    });

    // POST
    controller.finalize('collection', 'post', function(req, res, next) {
      req.baucis.send(redoc);
      req.baucis.send(req.baucis.formatter());
      next();
    });

    // PUT
    controller.finalize('put', function(req, res, next) {
      req.baucis.send(redoc);
      req.baucis.send(req.baucis.formatter());
      next();
    });

    // DELETE
    controller.finalize('delete', function(req, res, next) {
      // Remove each document from the database.
      req.baucis.send(function(context, callback) {
        context.doc.remove(callback);
      });
      // Respond with the count of deleted documents.
      req.baucis.send(count());
      req.baucis.send(eventStream.stringify());
      next();
    });

    controller.finalize(function(req, res, next) {
      req.baucis.send().pipe(
        eventStream.through(
          function(chunk) {
            res.write(chunk);
          },
          function() {
            res.addTrailers(trailers);
            res.end();
            this.emit('end');
          }
        )
      );
    });

    // If it's a Mongo bad hint error, convert to a bad request error.
    controller._use(function(error, req, res, next) {
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
    controller._use(function(error, req, res, next) {
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
    controller._use(function(error, req, res, next) {
      if (!error) return next();
      if (!(error instanceof mongoose.Error.ValidationError)) return next(error);
      const newError = RestError.UnprocessableEntity();
      newError.errors = error.errors;
      next(newError);
    });
    // Convert Mongoose version conflict error to LockConflict.
    controller._use(function(error, req, res, next) {
      if (!error) return next();
      if (!(error instanceof mongoose.Error.VersionError)) return next(error);
      next(RestError.LockConflict());
    });
    // Translate other errors to internal server errors.
    controller._use(function(error, request, response, next) {
      if (!error) return next();
      if (error instanceof RestError) return next(error);
      const error2 = RestError.InternalServerError(error.message);
      error2.stack = error.stack;
      next(error2);
    });
    // Format the error based on the Accept header.
    controller._use(function(error, req, res, next) {
      if (!error) return next();
      // Always set the status code if available.
      if (error.status >= 100) {
        res.status(error.status);
      }

      if (!controller.handleErrors()) return next(error);

      baucis.formatters(res, function(error2, formatter) {
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
          .pipe(res);
      });
    });
    getController.__extensions__.map(ext => ext(controller));
    return controller;
  };
  getController.__extensions__ = [];
  getController.addExtension = extension => {
    getController.__extensions__.push(extension);
  };
  return getController;
};
