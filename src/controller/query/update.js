// __Dependencies__
const util = require('util');
const express = require('express');
const es = require('event-stream');
const RestError = require('rest-error');

// __Private Module Members__
const validOperators = ['$set', '$push', '$pull', '$addToSet', '$pop', '$pushAll', '$pullAll'];

// __Module Definition__
const decorator = (module.exports = function(options, protect) {
  const baucis = require('../../..');
  const controller = this;

  function checkBadUpdateOperatorPaths(operator, paths) {
    let bad = false;
    const whitelisted = controller.operators(operator);
    let parts;

    if (!whitelisted) return true;

    parts = whitelisted.split(/\s+/);

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
      pipeline(es.readArray([request.body]));
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
      es.through(
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
        controller.model().update(request.baucis.conditions, wrapper, callback);
      });
    }

    const s = pipeline();
    s.on('end', next);
    s.resume();
  });
});
