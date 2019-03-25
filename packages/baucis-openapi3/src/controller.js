const _ = require('lodash/fp');
const utils = require('./utils');
const params = require('./parameters');

/**
 * extends Controller to add methods for generating OpenAPI data.
 */
module.exports = pluginOptions => function extendController(controller) {
  function buildTags(resourceName) {
    return [resourceName];
  }

  const verbToHuman = {put: 'Update', post: 'Create'};
  const humanVerb = verb => verbToHuman[verb] || 'undef';

  function buildRequestBodyFor(isInstance, verb, resourceName) {
    const requestBody = {
      description: `${humanVerb(
        verb
      )} a ${resourceName} by sending the paths to be updated in the request body.`,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${utils.capitalize(resourceName)}`
          }
        }
      }
    };
    if (isInstance && (verb === 'post' || verb === 'put')) {
      return requestBody;
    }
    return null;
  }
  function buildResponsesFor(isInstance, verb, resourceName, pluralName) {
    const responses = {};

    // default errors on baucis httpStatus code + string
    responses.default = {
      description: 'Unexpected error.',
      content: {
        'application/json': {
          schema: {
            type: 'string'
          }
        }
      }
    };
    if (isInstance || verb === 'post') {
      responses['200'] = {
        description: 'Sucessful response. Single resource.',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${utils.capitalize(resourceName)}`
            }
          }
        }
      };
    } else {
      responses['200'] = {
        description: 'Sucessful response. Collection of resources.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: `#/components/schemas/${utils.capitalize(resourceName)}`
              }
            }
          }
        }
      };
    }
    // Add other errors if needed: (400, 403, 412 etc. )
    responses['404'] = {
      description: isInstance
        ? `No ${resourceName} was found with that ID.`
        : `No ${pluralName} matched that query.`,
      content: {
        'application/json': {
          schema: {
            type: 'string'
            // '$ref': '#/components/schemas/ErrorModel'
          }
        }
      }
    };
    if (verb === 'put' || verb === 'post' || verb === 'patch') {
      responses['422'] = {
        description: 'Validation error.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        }
      };
    }
    return responses;
  }

  function buildSecurityFor() {
    return null; // no security defined
  }

  function buildOperationInfo(res, operationId, summary, description) {
    res.operationId = operationId;
    res.summary = summary;
    res.description = description;
    return res;
  }

  function buildBaseOperationInstance(verb, res, resourceKey, resourceName) {
    if (verb === 'get') {
      return buildOperationInfo(
        res,
        `get${resourceKey}ById`,
        `Get a ${resourceName} by its unique ID`,
        `Retrieve a ${resourceName} by its ID.`
      );
    } else if (verb === 'put') {
      return buildOperationInfo(
        res,
        `update${resourceKey}`,
        `Modify a ${resourceName} by its unique ID`,
        `Update an existing ${resourceName} by its ID.`
      );
    } else if (verb === 'delete') {
      return buildOperationInfo(
        res,
        `delete${resourceKey}ById`,
        `Delete a ${resourceName} by its unique ID`,
        `Deletes an existing ${resourceName} by its ID.`
      );
    }
  }

  function buildBaseOperationCollection(verb, res, resourceKey, pluralName) {
    if (verb === 'get') {
      return buildOperationInfo(
        res,
        `query${resourceKey}`,
        `Query some ${pluralName}`,
        `Query over ${pluralName}.`
      );
    } else if (verb === 'post') {
      return buildOperationInfo(
        res,
        `create${resourceKey}`,
        `Create some ${pluralName}`,
        `Create one or more ${pluralName}.`
      );
    } else if (verb === 'delete') {
      return buildOperationInfo(
        res,
        `delete${resourceKey}ByQuery`,
        `Delete some ${pluralName} by query`,
        `Delete all ${pluralName} matching the specified query.`
      );
    }
  }

  function buildBaseOperation(mode, verb, controller) {
    const resourceName = controller.model().singular();
    const pluralName = controller.model().plural();
    const isInstance = mode === 'instance';
    const resourceKey = utils.capitalize(resourceName);
    const res = {
      parameters: params.generateOperationParameters(isInstance, verb),
      responses: buildResponsesFor(isInstance, verb, resourceName, pluralName)
    };
    const rBody = buildRequestBodyFor(isInstance, verb, resourceName);
    if (rBody) {
      res.requestBody = rBody;
    }
    if (res.parameters.length === 0) {
      delete res.parameters;
    }
    const sec = buildSecurityFor();
    if (sec) {
      res.security = sec;
    }

    if (isInstance) {
      return buildBaseOperationInstance(verb, res, resourceKey, resourceName);
    } else {
      // collection
      return buildBaseOperationCollection(verb, res, resourceKey, pluralName);
    }
  }

  function buildOperation(containerPath, mode, verb) {
    const resourceName = controller.model().singular();
    const operation = buildBaseOperation(mode, verb, controller);
    operation.tags = buildTags(resourceName);
    containerPath[verb] = operation;
    return operation;
  }

  // Convert a Mongoose type into an openAPI type
  function openApi30TypeFor(type) {
    if (!type) {
      return null;
    }
    if (type === Number) {
      return 'number';
    }
    if (type === Boolean) {
      return 'boolean';
    }
    if (type === String || type === Date || type.name === 'ObjectId' || type.name === 'Oid') {
      return 'string';
    }
    if (Array.isArray(type) || type.name === 'Array') {
      return 'array';
    }
    if (
      type === Object ||
      type instanceof Object ||
      type.name === 'Mixed' ||
      type.name === 'Buffer'
    ) {
      return null;
    }
    throw new Error(`Unrecognized type: ${type}`);
  }

  function openApi30TypeFormatFor(type) {
    if (!type) {
      return null;
    }
    if (type === Number) {
      return 'double';
    }
    if (type === Date) {
      return 'date-time';
    }

    return null;
  }

  function skipProperty(name, path, controller) {
    const select = controller.select();
    const mode = select && select.match(/(?:^|\s)[-]/g) ? 'exclusive' : 'inclusive';
    const exclusiveNamePattern = new RegExp(`\\B-${name}\\b`, 'gi');
    const inclusiveNamePattern = new RegExp(`(?:\\B[+]|\\b)${name}\\b`, 'gi');
    // Keep deselected paths private
    if (path.selected === false) {
      return true;
    }
    // _id always included unless explicitly excluded?

    // If it's excluded, skip this one.
    if (select && mode === 'exclusive' && select.match(exclusiveNamePattern)) {
      return true;
    }
    // If the mode is inclusive but the name is not present, skip this one.
    if (select && mode === 'inclusive' && name !== '_id' && !select.match(inclusiveNamePattern)) {
      return true;
    }
    return false;
  }

  function referenceForType(type) {
    if (type && type.length > 0 && type[0]) {
      const sw2Type = openApi30TypeFor(type[0]);
      if (sw2Type) {
        return {
          isPrimitive: true,
          type: sw2Type // primitive type
        };
      } else {
        return {
          isPrimitive: false,
          type: `#/components/schemas/${type[0].name}` // not primitive: asume complex type def and reference schema
        };
      }
    }
    return {
      isPrimitive: true,
      type: 'string'
    }; // No info provided
  }

  function isArrayOfRefs(type) {
    return _.has('[0].ref') && _.get('[0].type.name', type) === 'ObjectId';
  }

  function warnInvalidType(name, path) {
    console.log(
      'Warning: That field type is not yet supported in baucis OpenAPI definitions, using "string."'
    );
    console.log('Path name: %s.%s', utils.capitalize(controller.model().singular()), name);
    console.log('Mongoose type: %s', path.options.type);
  }

  // A method used to generated an OpenAPI property for a model
  function generatePropertyDefinition(name, path, definitionName) {
    const property = {};
    const type = path.options.type ? openApi30TypeFor(path.options.type) : 'string'; // virtuals don't have type

    if (skipProperty(name, path, controller)) {
      return;
    }
    // Configure the property
    if (path.options.type && path.options.type.name === 'ObjectId') {
      if (name === '_id') {
        property.type = 'string';
      } else if (path.options.ref) {
        property.$ref = `#/components/schemas/${utils.capitalize(path.options.ref)}`;
      }
    } else if (path.schema) {
      // Choice (1. embed schema here or 2. reference and publish as a root definition)
      property.type = 'array';
      property.items = {
        // 2. reference
        $ref: `#/components/schemas/${definitionName}${utils.capitalize(name)}`
      };
    } else {
      property.type = type;
      if (type === 'array') {
        if (isArrayOfRefs(path.options.type)) {
          property.items = {
            type: 'string' // handle references as string (serialization for objectId)
          };
        } else {
          const resolvedType = referenceForType(path.options.type);
          if (resolvedType.isPrimitive) {
            property.items = {
              type: resolvedType.type
            };
          } else {
            property.items = {
              $ref: resolvedType.type
            };
          }
        }
      }
      const format = openApi30TypeFormatFor(path.options.type);
      if (format) {
        property.format = format;
      }
      if (name === '__v') {
        property.format = 'int32';
      }
    }

    /*
  // Set enum values if applicable
  if (path.enumValues && path.enumValues.length > 0) {
    // Pending:  property.allowableValues = { valueType: 'LIST', values: path.enumValues };
  }
  // Set allowable values range if min or max is present
  if (!isNaN(path.options.min) || !isNaN(path.options.max)) {
    // Pending: property.allowableValues = { valueType: 'RANGE' };
  }
  if (!isNaN(path.options.min)) {
    // Pending: property.allowableValues.min = path.options.min;
  }
  if (!isNaN(path.options.max)) {
    // Pending: property.allowableValues.max = path.options.max;
  }
*/
    if (!property.type && !property.$ref) {
      warnInvalidType(name, path);
      property.type = 'string';
    }
    return property;
  }

  function mergePaths(oaSchema, pathsCollection, definitionName) {
    Object.keys(pathsCollection).forEach(function(name) {
      const path = pathsCollection[name];
      const property = generatePropertyDefinition(name, path, definitionName);
      oaSchema.properties[name] = property;
      if (path.options.required) {
        oaSchema.required.push(name);
      }
    });
  }

  // A method used to generate an OpenAPI model schema for a controller
  function generateModelOpenApiSchema(schema, definitionName) {
    const oaSchema = {
      required: [],
      properties: {}
    };
    mergePaths(oaSchema, schema.paths, definitionName);
    mergePaths(oaSchema, schema.virtuals, definitionName);

    // remove empty arrays -> OpenAPI 3.0 validates
    if (oaSchema.required.length === 0) {
      delete oaSchema.required;
    }
    if (oaSchema.properties.length === 0) {
      delete oaSchema.properties;
    }
    return oaSchema;
  }

  function mergePathsForInnerSchemaDef(schemaDefs, collectionPaths, definitionName) {
    Object.keys(collectionPaths).forEach(function(name) {
      const path = collectionPaths[name];
      if (path.schema) {
        const newdefinitionName = definitionName + utils.capitalize(name); // <-- synthetic name (no info for this in input model)
        const def = generateModelOpenApiSchema(path.schema, newdefinitionName);
        schemaDefs[newdefinitionName] = def;
      }
    });
  }

  function addInnerModelSchemas(schemaDefs, definitionName) {
    const schema = controller.model().schema;
    mergePathsForInnerSchemaDef(schemaDefs, schema.paths, definitionName);
    mergePathsForInnerSchemaDef(schemaDefs, schema.virtuals, definitionName);
  }

  function buildPathParams(pathContainer, path, isInstance) {
    const pathParams = params.generatePathParameters(isInstance);
    if (pathParams.length > 0) {
      pathContainer[path] = {
        parameters: pathParams
      };
    }
  }

  controller.generateOpenApi3 = function() {
    if (controller.openApi3) {
      return controller;
    }

    const modelName = utils.capitalize(controller.model().singular());

    controller.openApi3 = {
      paths: {},
      components: {
        schemas: {}
      }
    };

    // Add Resource Model
    controller.openApi3.components.schemas[modelName] = generateModelOpenApiSchema(
      controller.model().schema,
      modelName
    );

    addInnerModelSchemas(controller.openApi3.components.schemas, modelName);

    // Paths
    const pluralName = controller.model().plural();

    const collectionPath = `/${pluralName}`;
    const instancePath = `/${pluralName}/{id}`;

    const paths = {};
    buildPathParams(paths, instancePath, true);
    buildPathParams(paths, collectionPath, false);

    const authorizedMethods = controller.methods();

    if (authorizedMethods.includes('get')) buildOperation(paths[instancePath], 'instance', 'get');
    if (authorizedMethods.includes('put')) buildOperation(paths[instancePath], 'instance', 'put');
    if (authorizedMethods.includes('delete'))
      buildOperation(paths[instancePath], 'instance', 'delete');
    if (authorizedMethods.includes('get'))
      buildOperation(paths[collectionPath], 'collection', 'get');
    if (authorizedMethods.includes('post'))
      buildOperation(paths[collectionPath], 'collection', 'post');
    if (authorizedMethods.includes('delete'))
      buildOperation(paths[collectionPath], 'collection', 'delete');
    controller.openApi3.paths = paths;

    return controller;
  };

  return controller;
};
