const utils = require('./utils');
const params = require('./parameters');

module.exports = (pluginOptions = {}) =>
  function extendController(controller) {
    function buildTags(resourceName) {
      return [resourceName];
    }

    function buildResponsesFor(isInstance, verb, resourceName, pluralName) {
      const responses = {};

      // default errors on baucis httpStatus code + string
      responses.default = {
        description: 'Unexpected error.',
        schema: {
          type: 'string'
        }
      };
      if (isInstance || verb === 'post') {
        responses['200'] = {
          description: 'Sucessful response. Single resource.',
          schema: {
            $ref: `#/definitions/${utils.capitalize(resourceName)}`
          }
        };
      } else {
        responses['200'] = {
          description: 'Sucessful response. Collection of resources.',
          schema: {
            type: 'array',
            items: {
              $ref: `#/definitions/${utils.capitalize(resourceName)}`
            }
          }
        };
      }
      // Add other errors if needed: (400, 403, 412 etc. )
      responses['404'] = {
        description: isInstance
          ? `No ${resourceName} was found with that ID.`
          : `No ${pluralName} matched that query.`,
        schema: {
          type: 'string'
          // '$ref': '#/definitions/ErrorModel'
        }
      };
      if (verb === 'put' || verb === 'post' || verb === 'patch') {
        responses['422'] = {
          description: 'Validation error.',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/ValidationError'
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
        // consumes: ['application/json'], //if used overrides global definition
        // produces: ['application/json'], //if used overrides global definition
        parameters: params.generateOperationParameters(isInstance, verb, controller),
        responses: buildResponsesFor(isInstance, verb, resourceName, pluralName)
      };
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

    // Convert a Mongoose type into a Swagger type
    function swagger20TypeFor(type) {
      if (!type) {
        return null;
      }
      if (type === Number) {
        return 'number';
      }
      if (type === Boolean) {
        return 'boolean';
      }
      if (
        type === String ||
        type === Date ||
        type === 'ObjectId' ||
        type.name === 'ObjectId' ||
        type.name === 'Oid' ||
        type.schemaName === 'ObjectId' ||
        type.schemaName === 'Oid'
      ) {
        return 'string';
      }
      if (Array.isArray(type) || type.name === 'Array') {
        return 'array';
      }
      if (type === Object || type instanceof Object || type === 'Mixed' || type === 'Buffer') {
        return null;
      }
      throw new Error(`Unrecognized type: ${type}`);
    }
    function swagger20TypeFormatFor(type) {
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

    function isArrayOfRefs(type) {
      return (
        type &&
        type.length > 0 &&
        type[0].ref &&
        type[0].type &&
        (type[0].type.name === 'ObjectId' || type[0].type.schemaName === 'ObjectId')
      );
    }
    function warnInvalidType(name, path) {
      console.log(
        'Warning: That field type is not yet supported in baucis Swagger definitions, using "string."'
      );
      console.log('Path name: %s.%s', utils.capitalize(controller.model().singular()), name);
      console.log('Mongoose type: %s', path.options.type);
    }

    function referenceForType(type) {
      if (type && type.length > 0 && type[0]) {
        const sw2Type = swagger20TypeFor(type[0]);
        if (sw2Type) {
          return {
            isPrimitive: true,
            type: sw2Type // primitive type
          };
        } else {
          return {
            isPrimitive: false,
            type: `#/definitions/${type[0].name}` // not primitive: asume complex type def and reference
          };
        }
      }
      return {
        isPrimitive: true,
        type: 'string'
      }; // No info provided
    }

    // A method used to generated a Swagger property for a model
    function generatePropertyDefinition(name, path, definitionName) {
      const property = {};
      const type = path.options.type ? swagger20TypeFor(path.options.type) : 'string'; // virtuals don't have type

      if (skipProperty(name, path, controller)) {
        return;
      }
      // Configure the property
      if (
        path.options.type &&
        (path.options.type.schemaName === 'ObjectId' || path.options.type.name === 'ObjectId')
      ) {
        if (name === '_id') {
          property.type = 'string';
        } else if (path.options.ref) {
          property.$ref = `#/definitions/${utils.capitalize(path.options.ref)}`;
        }
      } else if (path.schema) {
        // Choice (1. embed schema here or 2. reference and publish as a root definition)
        property.type = 'array';
        property.items = {
          // 2. reference
          $ref: `#/definitions/${definitionName}${utils.capitalize(name)}`
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
        const format = swagger20TypeFormatFor(path.options.type);
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

    function mergePaths(definition, pathsCollection, definitionName) {
      Object.keys(pathsCollection).forEach(function(name) {
        const path = pathsCollection[name];
        const property = generatePropertyDefinition(name, path, definitionName);
        definition.properties[name] = property;
        if (path.options.required) {
          definition.required.push(name);
        }
      });
    }

    // A method used to generate a Swagger model definition for a controller
    function generateModelDefinition(schema, definitionName) {
      const definition = {
        required: [],
        properties: {}
      };
      mergePaths(definition, schema.paths, definitionName);
      mergePaths(definition, schema.virtuals, definitionName);

      // remove empty arrays -> swagger 2.0 validates
      if (definition.required.length === 0) {
        delete definition.required;
      }
      if (definition.properties.length === 0) {
        delete definition.properties;
      }
      return definition;
    }

    function mergePathsForInnerDef(defs, collectionPaths, definitionName) {
      Object.keys(collectionPaths).forEach(function(name) {
        const path = collectionPaths[name];
        if (path.schema) {
          const newdefinitionName = definitionName + utils.capitalize(name); // <-- synthetic name (no info for this in input model)
          const def = generateModelDefinition(path.schema, newdefinitionName);
          defs[newdefinitionName] = def;
        }
      });
    }

    function buildPathParams(pathContainer, path, isInstance) {
      const pathParams = params.generatePathParameters(isInstance);
      if (pathParams.length > 0) {
        pathContainer[path] = {
          parameters: pathParams
        };
      }
    }

    function addInnerModelDefinitions(defs, definitionName) {
      const schema = controller.model().schema;
      mergePathsForInnerDef(defs, schema.paths, definitionName);
      mergePathsForInnerDef(defs, schema.virtuals, definitionName);
    }

    controller.generateSwagger2 = function() {
      if (controller.swagger2) {
        return controller;
      }

      const modelName = utils.capitalize(controller.model().singular());

      controller.swagger2 = {
        paths: {},
        definitions: {}
      };

      // Add Resource Model
      controller.swagger2.definitions[modelName] = generateModelDefinition(
        controller.model().schema,
        modelName
      );
      addInnerModelDefinitions(controller.swagger2.definitions, modelName);

      // Paths
      const pluralName = controller.model().plural();

      const collectionPath = `/${pluralName}`;
      const instancePath = `/${pluralName}/{id}`;

      const paths = {};
      buildPathParams(paths, instancePath, true);
      buildPathParams(paths, collectionPath, false);

      buildOperation(paths[instancePath], 'instance', 'get');
      buildOperation(paths[instancePath], 'instance', 'put');
      buildOperation(paths[instancePath], 'instance', 'delete');
      buildOperation(paths[collectionPath], 'collection', 'get');
      buildOperation(paths[collectionPath], 'collection', 'post');
      buildOperation(paths[collectionPath], 'collection', 'delete');
      controller.swagger2.paths = paths;

      return controller;
    };

    return controller;
  };
