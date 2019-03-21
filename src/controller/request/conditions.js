const RestError = require('rest-error');

// __Module Definition__
const decorator = (module.exports = function() {
  const controller = this;
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
});