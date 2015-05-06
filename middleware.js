'use strict';

// __Dependencies__
var url = require('url');
var deco = require('deco');
var baucis = require('baucis');
var qs = require('querystring');

// __Module Definition__
var decorator = module.exports = function (options, protect) {
  var controller = this;

  protect.property('relations', true);

  // Calculate basic links for instance routes.
  controller.query('instance', '*', function (request, response, next) {
    if (controller.relations() === false) return next();

    var originalPath = request.originalUrl.split('?')[0];
    var originalPathParts = originalPath.split('/');
    var linkBase;

    originalPathParts.pop();
    linkBase = originalPathParts.join('/');

    request.baucis.links = {
      collection: linkBase,
      search: linkBase,
      edit: linkBase + '/' + request.params.id,
      self: originalPath
    };

    next();
  });

  // Calculate basic links for collection routes.
  controller.query('collection', '*', function (request, response, next) {
    if (controller.relations() === false) return next();

    var originalPath = request.originalUrl.split('?')[0];
    // Used to create a link from current URL with new query string.
    var makeLink = function (query) {
      var newQuery = deco.merge(request.query, query);
      return originalPath + '?' + qs.stringify(newQuery);
    };
    // Response Link header links.
    var links = { search: originalPath, self: makeLink() };
    // Call this function to set response links then move on to next middleware.
    var done = function () { request.baucis.links = links, next() };

    // Add paging links unless these conditions are met.
    if (request.method !== 'GET') return done();
    if (!request.query.limit) return done();

    controller.model().count(request.baucis.conditions, function (error, count) {
      if (error) return next(error);

      var limit = Number(request.query.limit);
      var skip = Number(request.query.skip || 0);

      links.first = makeLink({ skip: 0 });
      links.last = makeLink({ skip: Math.max(0, count - limit) });

      if (skip) links.previous = makeLink({ skip: Math.max(0, skip - limit) });
      if (limit + skip < count) links.next = makeLink({ skip: limit + skip });

      done();
    });
  });

  // Add "Link" header field based on previously set links.
  controller.query(function (request, response, next) {
    if (controller.relations() === false) return next();
    if (!request.baucis.links) return next();
    response.links(request.baucis.links);
    next();
  });
};
