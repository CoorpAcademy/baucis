const qs = require('querystring');
const merge = require('lodash/fp/merge');

function extendControllerWithLinks(controller) {
  controller._relations = true;
  controller.relations = function(value) {
    if (arguments.length === 1) {
      controller._relations = value;
      return controller;
    } else {
      return controller._relations;
    }
  };

  // Calculate basic links for instance routes.
  controller.query('instance', '*', function(request, response, next) {
    if (controller.relations() === false) return next();

    const originalPath = request.originalUrl.split('?')[0];
    const originalPathParts = originalPath.split('/');

    originalPathParts.pop();
    const linkBase = originalPathParts.join('/');

    request.baucis.links = {
      collection: linkBase,
      search: linkBase,
      edit: `${linkBase}/${request.params.id}`,
      self: originalPath
    };

    next();
  });

  // Calculate basic links for collection routes.
  controller.query('collection', '*', function(request, response, next) {
    if (controller.relations() === false) return next();

    const originalPath = request.originalUrl.split('?')[0];
    // Used to create a link from current URL with new query string.
    const makeLink = function(query) {
      const newQuery = merge(request.query, query);
      return `${originalPath}?${qs.stringify(newQuery)}`;
    };
    // Response Link header links.
    const links = {search: originalPath, self: makeLink()};
    // Call this function to set response links then move on to next middleware.
    const done = function() {
      request.baucis.links = links;
      next();
    };

    // Add paging links unless these conditions are met.
    if (request.method !== 'GET') return done();
    if (!request.query.limit) return done();

    controller
      .model()
      .countDocuments(request.baucis.conditions)
      .then(function(count) {
        const limit = Number(request.query.limit);
        const skip = Number(request.query.skip || 0);

        links.first = makeLink({skip: 0});
        links.last = makeLink({skip: Math.max(0, count - limit)});

        if (skip) links.previous = makeLink({skip: Math.max(0, skip - limit)});
        if (limit + skip < count) links.next = makeLink({skip: limit + skip});

        return done();
      })
      .catch(done);
  });

  // Add "Link" header field based on previously set links.
  controller.query(function(request, response, next) {
    if (controller.relations() === false) return next();
    if (!request.baucis.links) return next();
    response.links(request.baucis.links);
    next();
  });
}

module.exports = function(baucis) {
  baucis.Controller.addExtension(extendControllerWithLinks);
};
