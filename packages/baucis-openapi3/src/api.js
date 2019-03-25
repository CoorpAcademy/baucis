const _ = require('lodash/fp');
const utils = require('./utils');
const params = require('./parameters');

// Implements OpenAPI 3.0.0-RC (implementers draft) as described in:
// https://www.openapis.org/blog/2017/03/01/openapi-spec-3-implementers-draft-released#
// https://github.com/OAI/OpenAPI-Specification/blob/3.0.0-rc0/versions/3.0.md

const clone = obj => (obj ? _.cloneDeep(obj) : {});

function mergeIn(container, items) {
  if (!items) {
    return;
  }
  for (const key in items) {
    if (items.hasOwnProperty(key)) {
      container[key] = items[key];
    }
  }
}

// Figure out the basePath for OpenAPI definition
function getBase(request, extra) {
  const parts = request.originalUrl.split('/');
  // Remove extra path parts.
  parts.splice(-extra, extra);
  const base = parts.join('/');
  return base;
}

function generateValidationErrorSchema() {
  const def = {
    required: ['message', 'name', 'kind', 'path'],
    properties: {
      properties: {
        $ref: '#/components/schemas/ValidationErrorProperties'
      },
      message: {
        type: 'string'
      },
      name: {
        type: 'string'
      },
      kind: {
        type: 'string'
      },
      path: {
        type: 'string'
      }
    }
  };
  return def;
}

function generateValidationErrorPropertiesSchema() {
  const def = {
    required: ['type', 'message', 'path'],
    properties: {
      type: {
        type: 'string'
      },
      message: {
        type: 'string'
      },
      path: {
        type: 'string'
      }
    }
  };
  return def;
}

function buildTags(opts, controllers) {
  const tags = [];
  if (controllers) {
    controllers.forEach(function(controller) {
      tags.push({
        name: controller.model().singular(),
        description: `${utils.capitalize(controller.model().singular())} resource.`,
        'x-resource': true // custom extension to state this tag represent a resource
      });
    });
  }
  return tags;
}

function buildPaths(opts, controllers) {
  const paths = {};
  if (controllers) {
    controllers.forEach(function(controller) {
      controller.generateOpenApi3();
      const collection = controller.openApi3.paths;
      for (const path in collection) {
        if (collection.hasOwnProperty(path)) {
          paths[path] = collection[path];
        }
      }
    });
  }
  return paths;
}
function buildDefaultServers() {
  return [
    {
      url: '/api'
    }
  ];
}

function defaultIfMissing(obj, prop, defaultValue) {
  if (!obj) {
    return;
  }
  if (!obj.hasOwnProperty(prop) || obj[prop] === null) {
    if (defaultValue) {
      obj[prop] = defaultValue;
    } else {
      delete obj[prop];
    }
  }
}

function buildInfo(options) {
  const info = options.info || {};
  defaultIfMissing(info, 'title', 'api');
  defaultIfMissing(info, 'description', 'Baucis generated OpenAPI v.3 documentation.');
  defaultIfMissing(info, 'version', null);

  // defaultIfMissing(info, 'termsOfService', null);

  // defaultIfMissing(info, 'contact', {
  //   name: "name",
  //   url: "http://acme.com",
  //   email: "name@acme.com"
  // });

  // defaultIfMissing(info, 'license', {
  //   name: "Apache 2.0",
  //   url: "http://www.apache.org/licenses/LICENSE-2.0.html"
  // });

  return info;
}

function buildSchemas(controllers) {
  const schemas = {};
  controllers.forEach(function(controller) {
    controller.generateOpenApi3();
    const collection = controller.openApi3.components.schemas;
    for (const def in collection) {
      if (collection.hasOwnProperty(def)) {
        schemas[def] = collection[def];
      }
    }
  });
  schemas.ValidationError = generateValidationErrorSchema();
  schemas.ValidationErrorProperties = generateValidationErrorPropertiesSchema();
  return schemas;
}

function buildParameters(controllers) {
  controllers.forEach(function() {});
  return params.generateCommonParams();
}

function buildResponses(controllers) {
  controllers.forEach(function() {});
  return {};
}

function buildSecuritySchemes(options, controllers) {
  controllers.forEach(function() {});
  return {};
}

function buildExamples(controllers) {
  controllers.forEach(function() {});
  return {};
}

function buildRequestBodies(controllers) {
  controllers.forEach(function() {});
  return {};
}

function buildHeaders(controllers) {
  controllers.forEach(function() {});
  return {};
}

function buildLinks(controllers) {
  controllers.forEach(function() {});
  return {};
}

function buildCallbacks(controllers) {
  controllers.forEach(function() {});
  return {};
}

function buildComponents(options, controllers) {
  const components = clone(options.components);

  defaultIfMissing(components, 'schemas', {});
  defaultIfMissing(components, 'responses', {});
  defaultIfMissing(components, 'parameters', {});
  defaultIfMissing(components, 'examples', {});
  defaultIfMissing(components, 'requestBodies', {});
  defaultIfMissing(components, 'headers', {});
  defaultIfMissing(components, 'securitySchemes', {});
  defaultIfMissing(components, 'links', {});
  defaultIfMissing(components, 'callbacks', {});

  mergeIn(components.schemas, buildSchemas(controllers));
  mergeIn(components.responses, buildResponses(controllers));
  mergeIn(components.parameters, buildParameters(controllers));
  mergeIn(components.examples, buildExamples(controllers));
  mergeIn(components.requestBodies, buildRequestBodies(controllers));
  mergeIn(components.headers, buildHeaders(controllers));
  mergeIn(components.securitySchemes, buildSecuritySchemes(options, controllers));
  mergeIn(components.links, buildLinks(controllers));
  mergeIn(components.callbacks, buildCallbacks(controllers));

  return components;
}

// A method for generating OpenAPI resource listing
function generateResourceListing(options) {
  const controllers = options.controllers;
  const opts = options.options || {};

  const listing = {
    openapi: '3.0.0',
    info: buildInfo(opts),
    servers: opts.servers || buildDefaultServers(),
    tags: buildTags(opts, controllers),
    paths: buildPaths(opts, controllers),
    components: buildComponents(opts, controllers)
  };

  mergeIn(listing.paths, opts.paths);

  if (opts.security) {
    listing.security = opts.security;
  }
  if (opts.externalDocs) {
    listing.externalDocs = opts.externalDocs;
  }

  return listing;
}

// build an specific spec based on options and filtered controllers
function generateResourceListingForVersion(options) {
  const clonedDoc = clone(options.rootDocument);
  if (!clonedDoc.info.version) {
    // Set baucis version if not provided previously by options
    clonedDoc.info.version = options.version;
  }
  clonedDoc.paths = clonedDoc.paths || {};
  mergeIn(clonedDoc.paths, buildPaths(options.controllers));

  clonedDoc.components.schemas = clonedDoc.components.schemas || {};
  const compo2 = buildComponents(options, options.controllers);
  mergeIn(clonedDoc.components.schemas, compo2.schemas);

  return clonedDoc;
}

module.exports = (pluginOptions = {}) =>
  function extendApi(api) {
    let customOpts = {};

    api.generateOpenApi3 = function(opts) {
      if (opts) {
        customOpts = opts;
      }
      // user can extend this openApi3Document
      api.openApi3Document = generateResourceListing({
        version: null,
        controllers: api.controllers('0.0.1'),
        basePath: null,
        options: customOpts
      });
      return api;
    };

    // Middleware for the documentation index.
    api.get('/openapi.json', function(request, response) {
      try {
        if (!api.openApi3Document) {
          api.generateOpenApi3(customOpts);
        }

        // Customize a openApi3Document copy by requested version
        const versionedApi = generateResourceListingForVersion({
          rootDocument: api.openApi3Document,
          version: request.baucis.release,
          controllers: api.controllers(request.baucis.release),
          basePath: getBase(request, 1),
          options: customOpts
        });

        response.json(versionedApi);
      } catch (e) {
        console.error(JSON.stringify(e));
        response.status(500).json(e);
      }
    });
  };
