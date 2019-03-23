// __Dependencies__
var utils = require('./utils');
var params = require('./parameters');

// __Private Module Members__

//Follows Swagger 2.0: as described in https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md


// Figure out the basePath for Swagger API definition
function getBase (request, extra) {
  var parts = request.originalUrl.split('/');
  // Remove extra path parts.
  parts.splice(-extra, extra);
  var base = parts.join('/'); 
  return base;
}

function generateValidationErrorDefinition() {
  var def = {
    required: ['message', 'name', 'kind', 'path'],
    properties: {
      properties: {
        '$ref': '#/definitions/ValidationErrorProperties'
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
function generateValidationErrorPropertiesDefinition() {
  var def = {
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

function buildTags(options) {
  var tags = []; 
  options.controllers.forEach(function (controller) {
    tags.push({
      name: controller.model().singular(),
      description: utils.capitalize(controller.model().singular()) + ' resource.',
	  'x-resource': true //custom extension to state this tag represent a resource
    });
  });
  return tags;
}

function buildPaths(controllers) {
  var paths = {};
  controllers.forEach(function (controller) {
    controller.generateSwagger2();
    var collection = controller.swagger2.paths;
    for (var path in collection) {
      if (collection.hasOwnProperty(path)) {
        paths[path] = collection[path];
      }
    }
  });
  return paths;
}
function buildDefinitions(controllers) {
  var definitions = {};
  controllers.forEach(function (controller) {
    controller.generateSwagger2();
    var collection = controller.swagger2.definitions;
    for (var def in collection) {
      if (collection.hasOwnProperty(def)) {
        definitions[def] = collection[def];
      }
    }
    definitions.ValidationError = generateValidationErrorDefinition();
    definitions.ValidationErrorProperties = generateValidationErrorPropertiesDefinition();    
  });
  return definitions;
}

// A method for generating a Swagger resource listing
function generateResourceListing (options) {
  var controllers = options.controllers;
  var opts = options.options || {};
  
  var paths = buildPaths(controllers);
  var definitions = buildDefinitions(controllers);

  var listing = {
    swagger: '2.0',
    info: {
      description: 'Baucis generated API',
      version: options.version,
      title: 'api',
      //termsOfService: 'TOS: to be defined.',
      //contact: { 
      //  email: 'me@address.com' 
      //},
      //license: {
      //  name: 'TBD',
      //  url: 'http://license.com'
      //}
    },
    //host: null, 
    basePath: options.basePath,
    tags: buildTags(options),
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json', 'text/html'],
    paths: paths,
    definitions: definitions,
    parameters: params.generateCommonParams()
    //responses: getReusableResponses(),
    //securityDefinitions: {},
    //security: []  // Must be added via extensions
    //externalDocs: null
  };
  
  if (opts.security) {
    listing.security = opts.security;	  
  }
  if (opts.securityDefinitions) {
    listing.securityDefinitions = opts.securityDefinitions;	  
  }

  return listing;
}

//build an specific spec based on options and filtered controllers
function generateResourceListingForVersion(options) {
  var clone = JSON.parse(JSON.stringify(options.rootDocument));
  clone.info.version =  options.version;
  clone.basePath = options.basePath;
  clone.paths = clone.paths || {};
  clone.definitions = clone.definitions || {};
  mergeIn(clone.paths, buildPaths(options.controllers));
  mergeIn(clone.definitions, buildDefinitions(options.controllers));

  return clone;
}

function mergeIn(container, items) {
	if (!items) {
		return;
	}
	for(var key in items) {
		if (items.hasOwnProperty(key)) {
			container[key] = items[key];
        }
	}
}


// __Module Definition__
module.exports = function (options, protect) {
  var api = this;

  api.generateSwagger2 = function() {
    //user can extend this swagger2Document
    api.swagger2Document = generateResourceListing({
      version: null,
      controllers: protect.controllers('0.0.1'),
      basePath: null,
	  options: options
    });
    return api;
  };

  // Middleware for the documentation index.
  api.get('/swagger.json', function (request, response) {
    if (!api.swagger2Document) {
      api.generateSwagger2();
    }
    //Customize a swagger2Document copy by requested version
    var versionedApi = generateResourceListingForVersion({
      rootDocument: api.swagger2Document,
      version: request.baucis.release,
      controllers: protect.controllers(request.baucis.release),
      basePath: getBase(request, 1),
	  options: options
    });

    response.json(versionedApi);
  });

  return api;
};
