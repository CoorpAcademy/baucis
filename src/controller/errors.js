// __Dependencies__
const util = require('util');
const es = require('event-stream');
const mongoose = require('mongoose');
const RestError = require('rest-error');

// __Module Definition__
module.exports = function(options, protect) {
  const baucis = require('../..');

  const controller = this;
  // A controller property used to set what error status code
  // and response is sent when a query to a collection endpoint
  // yields no documents.
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

      es
        .readArray(errors)
        .pipe(f)
        .pipe(response);
    });
  });
};
