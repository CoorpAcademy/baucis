// This is a Controller mixin to add methods for generating Swagger data.

// Convert a Mongoose type into a Swagger type
function swaggerTypeFor(type) {
  if (!type) return null;
  if (type === String) return 'string';
  if (type === Number) return 'double';
  if (type === Date) return 'Date';
  if (type === Boolean) return 'boolean';
  if (Array.isArray(type) || type.name === 'Array') return 'Array';
  // mongoose Types
  if (type.name === 'ObjectID' || type.name === 'ObjectId') return 'string';
  if (type.name === 'Oid') return 'string';
  if (type.name === 'Array') return 'Array';
  if (type.name === 'Buffer') return null;
  if (type.name === 'Mixed') return null;
  // Fallbacks
  if (type instanceof Object) return null;
  if (type === Object) return null;
  throw new Error(`Unrecognized type: ${type}`);
}

// A method for capitalizing the first letter of a string
function capitalize(s) {
  if (!s) return s;
  if (s.length === 1) return s.toUpperCase();
  return s[0].toUpperCase() + s.substring(1);
}

// __Module Definition__
module.exports = function() {
  const controller = this;

  // __Private Instance Members__

  // A method used to generated a Swagger property for a model
  function generatePropertyDefinition(name, path) {
    const property = {};
    const select = controller.select();
    const type = path.options.type ? swaggerTypeFor(path.options.type) : 'string'; // virtuals don't have type
    const mode = select && select.match(/(?:^|\s)[-]/g) ? 'exclusive' : 'inclusive';
    const exclusiveNamePattern = new RegExp(`\\B-${name}\\b`, 'gi');
    const inclusiveNamePattern = new RegExp(`(?:\\B[+]|\\b)${name}\\b`, 'gi');

    // Keep deselected paths private
    if (path.selected === false) return;

    // TODO is _id always included unless explicitly excluded?

    // If it's excluded, skip this one.
    if (select && mode === 'exclusive' && select.match(exclusiveNamePattern)) return;
    // If the mode is inclusive but the name is not present, skip this one.
    if (select && mode === 'inclusive' && name !== '_id' && !select.match(inclusiveNamePattern))
      return;

    // Configure the property
    property.required = path.options.required || false; // TODO _id is required for PUT
    property.type = type;

    // Set enum values if applicable
    if (path.enumValues && path.enumValues.length > 0) {
      property.allowableValues = {valueType: 'LIST', values: path.enumValues};
    }

    // Set allowable values range if min or max is present
    if (!isNaN(path.options.min) || !isNaN(path.options.max)) {
      property.allowableValues = {valueType: 'RANGE'};
    }

    if (!isNaN(path.options.min)) {
      property.allowableValues.min = path.options.min;
    }

    if (!isNaN(path.options.max)) {
      property.allowableValues.max = path.options.max;
    }

    if (!property.type) {
      // FIXME: disable this on option.....
      console.log(
        'Warning: That field type is not yet supported in baucis Swagger definitions, using "string."'
      );
      console.log('Path name: %s.%s', capitalize(controller.model().singular()), name);
      console.log('Mongoose type: %s', path.options.type);
      property.type = 'string';
    }

    return property;
  }

  // A method used to generate a Swagger model definition for a controller
  function generateModelDefinition() {
    const definition = {};
    const schema = controller.model().schema;

    definition.id = capitalize(controller.model().singular());
    definition.properties = {};

    Object.keys(schema.paths).forEach(function(name) {
      const path = schema.paths[name];
      const property = generatePropertyDefinition(name, path);
      definition.properties[name] = property;
    });

    Object.keys(schema.virtuals).forEach(function(name) {
      const path = schema.virtuals[name];
      const property = generatePropertyDefinition(name, path);
      definition.properties[name] = property;
    });

    return definition;
  }

  // Generate parameter list for operations
  function generateParameters(verb, plural) {
    const parameters = [];

    // Parameters available for singular routes
    if (!plural) {
      parameters.push({
        paramType: 'path',
        name: 'id',
        description: `The ID of a ${controller.model().singular()}`,
        dataType: 'string',
        required: true,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'header',
        name: 'X-Baucis-Update-Operator',
        description:
          '**BYPASSES VALIDATION** May be used with PUT to update the document using $push, $pull, or $set.',
        dataType: 'string',
        required: false,
        allowMultiple: false
      });
    }

    // Parameters available for plural routes
    if (plural) {
      parameters.push({
        paramType: 'query',
        name: 'skip',
        description: 'How many documents to skip.',
        dataType: 'int',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'limit',
        description: 'The maximum number of documents to send.',
        dataType: 'int',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'count',
        description: 'Set to true to return count instead of documents.',
        dataType: 'boolean',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'conditions',
        description: 'Set the conditions used to find or remove the document(s).',
        dataType: 'string',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'sort',
        description: 'Set the fields by which to sort.',
        dataType: 'string',
        required: false,
        allowMultiple: false
      });
    }

    // Parameters available for singular and plural routes
    parameters.push({
      paramType: 'query',
      name: 'select',
      description: 'Select which paths will be returned by the query.',
      dataType: 'string',
      required: false,
      allowMultiple: false
    });

    parameters.push({
      paramType: 'query',
      name: 'populate',
      description: 'Specify which paths to populate.',
      dataType: 'string',
      required: false,
      allowMultiple: false
    });

    if (verb === 'post') {
      // TODO post body can be single or array
      parameters.push({
        paramType: 'body',
        name: 'document',
        description: 'Create a document by sending the paths to be updated in the request body.',
        dataType: capitalize(controller.model().singular()),
        required: true,
        allowMultiple: false
      });
    }

    if (verb === 'put') {
      parameters.push({
        paramType: 'body',
        name: 'document',
        description: 'Update a document by sending the paths to be updated in the request body.',
        dataType: capitalize(controller.model().singular()),
        required: true,
        allowMultiple: false
      });
    }

    return parameters;
  }

  function generateErrorResponses(plural) {
    const errorResponses = [];

    // TODO other errors (400, 403, etc. )

    // Error rosponses for singular operations
    if (!plural) {
      errorResponses.push({
        code: 404,
        reason: `No ${controller.model().singular()} was found with that ID.`
      });
    }

    // Error rosponses for plural operations
    if (plural) {
      errorResponses.push({
        code: 404,
        reason: `No ${controller.model().plural()} matched that query.`
      });
    }

    // Error rosponses for both singular and plural operations
    // None.

    return errorResponses;
  }

  // Generate a list of a controller's operations
  function generateOperations(plural) {
    const operations = [];

    controller.methods().forEach(function(verb) {
      const operation = {};
      const titlePlural = capitalize(controller.model().plural());
      const titleSingular = capitalize(controller.model().singular());

      // Don't do head, post/put for single/plural
      if (verb === 'head') return;
      if (verb === 'post' && !plural) return;
      if (verb === 'put' && plural) return;

      // Use the full word
      if (verb === 'del') verb = 'delete';

      operation.httpMethod = verb.toUpperCase();

      if (plural) operation.nickname = verb + titlePlural;
      else operation.nickname = `${verb + titleSingular}ById`;

      operation.responseClass = titleSingular; // TODO sometimes an array!

      if (plural) operation.summary = `${capitalize(verb)} some ${controller.model().plural()}`;
      else
        operation.summary = `${capitalize(
          verb
        )} a ${controller.model().singular()} by its unique ID`;

      operation.parameters = generateParameters(verb, plural);
      operation.errorResponses = generateErrorResponses(plural);

      operations.push(operation);
    });

    return operations;
  }

  // __Build the Definition__
  controller.generateSwagger = function() {
    if (controller.swagger) return controller;

    const modelName = capitalize(controller.model().singular());

    controller.swagger = {apis: [], models: {}};

    // Model
    controller.swagger.models[modelName] = generateModelDefinition();

    // Instance route
    controller.swagger.apis.push({
      path: `/${controller.model().plural()}/{id}`,
      description: `Operations about a given ${controller.model().singular()}`,
      operations: generateOperations(false)
    });

    // Collection route
    controller.swagger.apis.push({
      path: `/${controller.model().plural()}`,
      description: `Operations about ${controller.model().plural()}`,
      operations: generateOperations(true)
    });

    return controller;
  };

  return controller;
};
