const util = require('util');
const crypto = require('crypto');
const RestError = require('rest-error');
const semver = require('semver');
const _ = require('lodash/fp');
const miss = require('mississippi');

const {
  isPositiveInteger,
  getAsInt,
  isNonNegativeInteger
} = require('./utils/predicates-and-accessors');
const {defineRoutes, combineErrorMiddleware} = require('./utils/routing');

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
          .filter(_.identity)
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
          .filter(_.identity)
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
    controller._errorHandlers = [];
    controller._combinedErrorHandler = null;
    controller.errorHandler = function(...handlers) {
      if (handlers.length >= 1) {
        controller._errorHandlers.push(...handlers);
        controller._combinedErrorHandler =
          controller._errorHandlers.length === 1
            ? controller._errorHandlers[0]
            : combineErrorMiddleware(controller._errorHandlers);
        return controller;
      } else {
        return controller._errorHandlers;
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
      return function(transmute) {
        // If it's a stream, add it to the reserve pipeline.
        if (transmute && (transmute.writable || transmute.readable)) {
          streams.push(transmute);
          return transmute;
        }
        // If it's a function, create a map stream with it.
        if (transmute) {
          const stream = miss.through.obj((chunk, enc, cb) => transmute(chunk, cb));
          streams.push(stream);
          return stream;
        }
        // If called without arguments, return a pipeline linking all streams.
        if (streams.length > 0) {
          return streams; // eventStream.pipeline(...streams);
        }
        // But, if no streams were added, just pass back a through stream.
        return [miss.through.obj()];
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
        pipeline(miss.from.obj([].concat(req.body)));
      } else {
        // Otherwise, stream and parse the request.
        parser = baucis.parser(req.get('content-type'));
        if (!parser) return next(RestError.UnsupportedMediaType());
        let alreadyDrained = false;
        pipeline(
          miss.from((size, cb) => {
            if (alreadyDrained) return cb(null, null);
            alreadyDrained = true;
            miss.pipe(
              req,
              miss.concat({encoding: 'buffer'}, buf => {
                cb(null, buf);
              }),
              err => (err ? cb(err) : null)
            );
          })
        );
        pipeline(parser);
      }
      // Create the stream context.
      pipeline(function(incoming, callback) {
        callback(null, {incoming, doc: null});
      });
      // Process the incoming document or documents.
      req.baucis.incoming().map(pipeline);
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
        context.doc
          .save()
          .then(doc => callback(null, {incoming: context.incoming, doc}))
          .catch(callback);
      });
      // Map the saved documents to document IDs.
      pipeline(function(context, callback) {
        callback(null, context.doc.get(findBy));
      });
      // Write the IDs to an array and process them.
      miss.pipe(
        ...pipeline(),
        miss.concat({encoding: 'object'}, function(ids) {
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
        }),
        err => (err ? next(err) : null)
      );
    });

    // /※Update
    const validOperators = ['$set', '$push', '$pull', '$addToSet', '$pop', '$pushAll', '$pullAll'];
    // §todo: maybe make it configurable

    function checkBadUpdateOperatorPaths(operator, paths) {
      const whitelisted = controller.operators(operator);

      if (!whitelisted) return true;
      const parts = whitelisted.split(/\s+/);
      return _.any(path => parts.indexOf(path) === -1, paths);
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
        pipeline(miss.from.obj([req.body]));
      } else {
        // Otherwise, stream and parse the request.
        parser = baucis.parser(req.get('content-type'));
        if (!parser) return next(RestError.UnsupportedMediaType());
        let alreadyDrained = false;
        pipeline(
          miss.from((size, cb) => {
            if (alreadyDrained) return cb(null, null);
            alreadyDrained = true;
            miss.pipe(
              req,
              miss.concat({encoding: 'buffer'}, buf => {
                cb(null, buf);
              }),
              err => (err ? cb(err) : null)
            );
          })
        );
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
          query
            .exec()
            .then(function(doc) {
              if (!doc) throw RestError.NotFound();
              // Add the Mongoose document to the context.
              return callback(null, {doc, incoming: context.incoming});
            })
            .catch(callback);
        });
      }
      // Pipe through user streams, if any.
      req.baucis.incoming().map(pipeline);
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
        miss.through.obj(
          function(context, enc, cb) {
            count += 1;
            if (count === 2) {
              cb(
                RestError.UnprocessableEntity({
                  message: 'The request body contained more than one update document',
                  name: 'RestError'
                })
              );
              return;
            }
            if (count > 1) return;

            cb(null, context);
          },
          function(cb) {
            if (count === 0) {
              cb(
                RestError.UnprocessableEntity({
                  message: 'The request body did not contain an update document',
                  name: 'RestError'
                })
              );
              return;
            }
            cb();
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
          context.doc
            .save()
            .then(doc => callback(null, doc))
            .catch(callback);
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
          controller
            .model()
            .updateMany(req.baucis.conditions, wrapper)
            .then(values => callback(null, values))
            .catch(callback);
        });
      }

      miss.pipe(
        ...pipeline(),
        next
      );
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
      return _.any(path => new RegExp(`[+]?${path}\\b`, 'i').exec(select), controller.deselected());
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
      query
        .exec()
        .then(function(values) {
          req.baucis.documents = values;
          return next();
        })
        .catch(next);
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
      req.baucis.query.hint(_.mapValues(_.toNumber, hint));

      next();
    });

    // / §SEND
    const lastModifiedPath = controller.model().lastModified();
    const trailers = {};

    /**
     *  Format the Trailer header.
     *  Deprecated. See: https://stackoverflow.com/questions/22033933/using-trailer-header-with-http-chunked-transfer-how-to-set-cookie-using-it
     */
    // function addTrailer(response, header) {
    //   const current = response.get('Trailer');
    //   if (!current) response.set('Trailer', header);
    //   else response.set('Trailer', `${current}, ${header}`);
    // }
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
        // addTrailer(response, 'Etag');
        response.set('Transfer-Encoding', 'chunked');
      }

      const hash = crypto.createHash('md5');

      return miss.through.obj(
        function(chunk, enc, cb) {
          hash.update(chunk);
          cb(null, chunk);
        },
        function(cb) {
          if (useTrailer) {
            trailers.Etag = `"${hash.digest('hex')}"`;
          } else {
            response.set('Etag', `"${hash.digest('hex')}"`);
          }

          cb();
        }
      );
    }

    function etagImmediate(response) {
      const hash = crypto.createHash('md5');

      return miss.through.obj(function(chunk, enc, cb) {
        hash.update(JSON.stringify(chunk));
        response.set('Etag', `"${hash.digest('hex')}"`);
        cb(null, chunk);
      });
    }
    /**
     * Generate a Last-Modified header/trailer
     */
    function lastModified(response, useTrailer) {
      if (useTrailer) {
        // addTrailer(response, 'Last-Modified');
        response.set('Transfer-Encoding', 'chunked');
      }

      let latest = null;

      return miss.through.obj(
        function(context, enc, cb) {
          if (!context) return cb();
          if (!context.doc) return cb(null, context);
          if (!context.doc.get) return cb(null, context);

          const current = context.doc.get(lastModifiedPath);
          latest = latest === null ? current : new Date(Math.max(latest, current));
          if (!useTrailer) {
            response.set('Last-Modified', latest.toUTCString());
          }
          cb(null, context);
        },
        function(cb) {
          if (useTrailer && latest) trailers['Last-Modified'] = latest.toUTCString();

          cb();
        }
      );
    }

    /**
     * Build a reduce stream.
     */
    function reduce(accumulated, f) {
      return miss.through.obj(
        function(context, enc, cb) {
          accumulated = f(accumulated, context);
          cb();
        },
        function(cb) {
          cb(null, accumulated);
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

    function stringify() {
      return miss.through.obj(function(chunk, enc, cb) {
        try {
          return cb(null, `${JSON.stringify(Buffer.isBuffer(chunk) ? chunk.toString() : chunk)}\n`);
        } catch (err) {
          return cb(err);
        }
      });
    }

    // If counting get the count and send it back directly.
    controller.finalize(function(req, res, next) {
      if (!req.baucis.count) return next();

      req.baucis.query
        .countDocuments()
        .then(function(n) {
          res.removeHeader('Transfer-Encoding');
          return res.json(n); // TODO support other content types
        })
        .catch(next);
    });

    // If not counting, create the basic stream pipeline.
    controller.finalize('collection', 'all', function(req, res, next) {
      let count = 0;
      const documents = req.baucis.documents;
      const pipeline = controller.pipeline(next);
      req.baucis.send = pipeline;
      // If documents were set in the baucis hash, use them.
      if (documents) pipeline(miss.from.obj([].concat(documents)));
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
        miss.through.obj(
          function(context, enc, cb) {
            count += 1;
            cb(null, context);
          },
          function(cb) {
            if (count > 0) return cb();
            const status = controller.emptyCollection();
            res.status(status);

            if (status === 204) {
              res.removeHeader('Trailer');
              res.send();
              return cb();
            }
            if (status === 200) {
              res.removeHeader('Transfer-Encoding');
              res.removeHeader('Trailer');
              res.json([]); // TODO other content types
              return cb();
            }

            cb(RestError.NotFound());
          }
        )
      );
      // Apply user streams.
      req.baucis.outgoing().map(pipeline);

      // Set the document formatter based on the Accept header of the request.
      baucis._formatters(res, function(error, formatter) {
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
        pipeline(miss.from.obj([].concat(documents)));
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
        miss.through.obj(
          function(context, enc, cb) {
            count += 1;
            cb(null, context);
          },
          function(cb) {
            if (count > 0) return cb();
            cb(RestError.NotFound());
          }
        )
      );
      // Apply user streams.
      req.baucis.outgoing().map(pipeline);

      // Set the document formatter based on the Accept header of the request.
      baucis._formatters(res, function(error, formatter) {
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
        req.baucis.send(stringify());
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
        return context.doc.deleteOne().then(stats => callback(null, stats), callback);
      });
      // Respond with the count of deleted documents.
      req.baucis.send(count());
      req.baucis.send(stringify());
      next();
    });

    controller.finalize(function(req, res, next) {
      miss.pipe(
        ...req.baucis.send(),
        miss.through(
          function(chunk, enc, cb) {
            res.write(chunk);
            cb();
          },
          function(cb) {
            res.addTrailers(trailers);
            res.end();
            cb();
          }
        ),
        next
      );
    });

    // If it's a Mongo bad hint error, convert to a bad request error.
    controller._use(function(err, req, res, next) {
      if (!err) return next();
      if (!err.message) return next(err);

      const message = 'The requested query hint is invalid';
      // Bad Mongo query hint (2.x).
      if (err.message === 'bad hint') {
        next(RestError.BadRequest(message));
        return;
      }
      // Bad Mongo query hint (3.x).
      if (err.message.match('planner returned error: bad hint')) {
        next(RestError.BadRequest(message));
        return;
      }
      // Bad Mongo query hint (5.x).
      if (
        err.message.match(
          'planner returned error :: caused by :: hint provided does not correspond to an existing index'
        )
      ) {
        next(RestError.BadRequest(message));
        return;
      }
      if (!err.$err) return next(err);
      // Mongoose 3
      if (err.$err.match('planner returned error: bad hint')) {
        next(RestError.BadRequest(message));
        return;
      }
      next(err);
    });
    // Convert Mongo duplicate key error to an unprocessible entity error
    controller._use(function(err, req, res, next) {
      if (!err) return next();
      if (!err.message) return next(err);
      if (err.message.indexOf('E11000 duplicate key error') === -1) {
        next(err);
        return;
      }

      const body = {};
      const scrape = /(.*?[:]){2} (.*)[_](.*?["])(.*)(.*?["])/;

      const scraped = scrape.exec(err.message);
      const path = scraped ? scraped[2] : '???';
      const value = scraped ? scraped[4] : '???';
      body[path] = {
        message: util.format('Path `%s` (%s) must be unique.', path, value),
        originalMessage: err.message,
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
    controller._use(function(err, req, res, next) {
      if (!err) return next();
      if (!(err instanceof mongoose.Error.ValidationError)) return next(err);
      const newError = RestError.UnprocessableEntity();
      newError.errors = err.errors;
      next(newError);
    });
    // Convert Mongoose version conflict error to LockConflict.
    controller._use(function(err, req, res, next) {
      if (!err) return next();
      if (!(err instanceof mongoose.Error.VersionError)) return next(err);
      next(RestError.LockConflict());
    });
    // Translate other errors to internal server errors.
    controller._use(function(err, req, res, next) {
      if (!err) return next();
      if (err instanceof RestError) return next(err);
      if (_.isInteger(err.status) || _.isInteger(err.statusCode)) return next(err);
      const error2 = RestError.InternalServerError(err.message);
      error2.stack = err.stack;
      next(error2);
    });

    controller._use(function(err, req, res, next) {
      if (!err) return next();
      if (!controller._combinedErrorHandler) return next(err);
      controller._combinedErrorHandler(err, req, res, next);
    });

    // Format the error based on the Accept header.
    controller._use(function(err, req, res, next) {
      if (!err) return next();
      // Always set the status code if available.
      if (err.status >= 100) {
        res.status(err.status);
      } else if (err.statusCode >= 100) {
        res.status(err.statusCode);
      }

      if (!controller.handleErrors()) return next(err);

      baucis._formatters(res, function(err2, formatter) {
        if (err2) return next(err2);

        let errors;

        if (!err.errors) {
          errors = [err];
        } else if (Array.isArray(err.errors) && err.errors.length !== 0) {
          errors = err.errors;
        } else {
          errors = Object.keys(err.errors).map(function(key) {
            return err.errors[key];
          });
        }

        if (errors.length === 0) {
          errors = [err];
        }

        errors = errors.map(function(error3) {
          const o = {};
          Object.getOwnPropertyNames(error3).forEach(function(key) {
            o[key] = error3[key];
          });
          if (error3 instanceof Error) {
            o.name = error3.name;
          }
          return o;
        });

        // TODO deprecated -- always send as single error in 2.0.0
        const f = formatter(err instanceof RestError.UnprocessableEntity);

        miss.pipe(
          miss.from.obj(errors),
          f,
          miss.through(
            (chunk, enc, cb) => {
              res.write(chunk);
              cb();
            },
            cb => {
              res.end();
              cb();
            }
          ),
          next
        );
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
