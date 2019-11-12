const {expect} = require('chai');
const request = require('request-promise');

const fixtures = require('./fixtures/vegetable');

function getItemFromArray(array, selector, value) {
  for (const item in array) {
    if (array[item][selector] === value) {
      return array[item];
    }
  }
  return null;
}

const getSwaggerOptions = {
  resolveWithFullResponse: true,
  uri: 'http://localhost:8012/api/swagger.json',
  json: true
};

describe('Swagger 2.0 Resources', function() {
  before(fixtures.init);
  beforeEach(fixtures.create);
  after(fixtures.deinit);

  describe('header info', function() {
    it('should generate the correct header', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);
      expect(body.info).to.have.property('version', '0.0.1');
      expect(body).to.have.property('swagger', '2.0');
      expect(body).to.have.property('basePath', '/api');
      expect(body).to.have.property('host', 'api.acme.com:8012');
      expect(body).to.have.property('x-powered-by', 'baucis');

      expect(body).to.have.property('paths');

      expect(body.tags).to.be.an('Array');
      expect(body.schemes).to.be.an('Array');
      expect(body.schemes[0]).to.equal('http');
      expect(body.schemes[1]).to.equal('https');

      expect(body.consumes).to.be.an('Array');
      expect(body.consumes.length).to.equal(1);
      expect(body.consumes[0]).to.equal('application/json');

      expect(body.produces).to.be.an('Array');
      expect(body.produces.length).to.equal(2);
      expect(body.produces[0]).to.equal('application/json');
      expect(body.produces[1]).to.equal('text/html');

      // Check the API listing
      const paths = body.paths;
      expect(paths).to.be.an('Object');
      expect(body.definitions).to.be.an('Object');

      const pathInstance0 = body.paths['/vegetables/{id}'];
      expect(pathInstance0).to.be.an('Object');

      expect(pathInstance0.get).to.be.an('Object');
      expect(pathInstance0.put).to.be.an('Object');
      expect(pathInstance0.delete).to.be.an('Object');

      expect(pathInstance0.get.tags).to.be.an('Array');
      expect(pathInstance0.get.operationId).to.equal('getVegetableById');
      expect(pathInstance0.get.summary).to.equal('Get a vegetable by its unique ID');
      expect(pathInstance0.get.description).to.equal('Retrieve a vegetable by its ID.');
      expect(pathInstance0.get.parameters).to.equal(undefined);
      expect(pathInstance0.get.responses).to.be.an('Object');
      expect(pathInstance0.get.security).to.equal(undefined);

      expect(pathInstance0.put.operationId).to.equal('updateVegetable');
      expect(pathInstance0.put.summary).to.equal('Modify a vegetable by its unique ID');
      expect(pathInstance0.put.description).to.equal('Update an existing vegetable by its ID.');

      expect(pathInstance0.delete.operationId).to.equal('deleteVegetableById');
      expect(pathInstance0.delete.summary).to.equal('Delete a vegetable by its unique ID');
      expect(pathInstance0.delete.description).to.equal('Deletes an existing vegetable by its ID.');

      const pathCollection0 = body.paths['/vegetables'];
      expect(pathCollection0).to.be.an('Object');

      expect(pathCollection0.get).to.be.an('Object');
      expect(pathCollection0.post).to.be.an('Object');
      expect(pathCollection0.delete).to.be.an('Object');

      expect(pathCollection0.get.tags).to.be.an('Array');
      expect(pathCollection0.get.operationId).to.equal('queryVegetable');
      expect(pathCollection0.get.summary).to.equal('Query some vegetables');
      expect(pathCollection0.get.description).to.equal('Query over vegetables.');
      expect(pathCollection0.get.parameters).to.be.an('Array');
      expect(pathCollection0.get.responses).to.be.an('Object');
      expect(pathCollection0.get.security).to.equal(undefined);

      expect(pathCollection0.post.operationId).to.equal('createVegetable');
      expect(pathCollection0.post.summary).to.equal('Create some vegetables');
      expect(pathCollection0.post.description).to.equal('Create one or more vegetables.');

      expect(pathCollection0.delete.operationId).to.equal('deleteVegetableByQuery');
      expect(pathCollection0.delete.summary).to.equal('Delete some vegetables by query');
      expect(pathCollection0.delete.description).to.equal(
        'Delete all vegetables matching the specified query.'
      );
    });
  });

  it('should generate no security info (to be added by customization)', async function() {
    const {statusCode, body} = await request(getSwaggerOptions);
    expect(statusCode).to.equal(200);
    expect(body).to.have.property('swagger', '2.0');
    expect(body.security).to.equal(undefined);
    expect(body.securityDefinitions).to.equal(undefined);
  });

  describe('paths', function() {
    it('should generate the correct GET /vegetables operation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const pathCollection0 = body.paths['/vegetables'];
      expect(pathCollection0).to.be.an('Object');

      expect(pathCollection0.get).to.be.an('Object');
      expect(pathCollection0.get.tags).to.be.an('Array');
      expect(pathCollection0.get.operationId).to.equal('queryVegetable');
      expect(pathCollection0.get.summary).to.equal('Query some vegetables');
      expect(pathCollection0.get.description).to.equal('Query over vegetables.');
      expect(pathCollection0.get.parameters).to.be.an('Array');
      expect(pathCollection0.get.responses).to.be.an('Object');
      expect(pathCollection0.get.security).to.equal(undefined);
    });

    it('should generate the correct POST /vegetables operation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const pathCollection0 = body.paths['/vegetables'];
      expect(pathCollection0).to.be.an('Object');
      expect(pathCollection0.post).to.be.an('Object');
      expect(pathCollection0.post.operationId).to.equal('createVegetable');
      expect(pathCollection0.post.summary).to.equal('Create some vegetables');
      expect(pathCollection0.post.description).to.equal('Create one or more vegetables.');
    });

    it('should generate unique names per operationId', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const pathCollection0 = body.paths['/vegetables'];
      expect(pathCollection0.post.operationId).to.equal('createVegetable');
      expect(pathCollection0.delete.operationId).to.equal('deleteVegetableByQuery');
      expect(pathCollection0.get.operationId).to.equal('queryVegetable');

      const pathInstance0 = body.paths['/vegetables/{id}'];
      expect(pathInstance0.put.operationId).to.equal('updateVegetable');
      expect(pathInstance0.delete.operationId).to.equal('deleteVegetableById');
      expect(pathInstance0.get.operationId).to.equal('getVegetableById');
    });

    it('should generate the correct DELETE /vegetables operation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const pathCollection0 = body.paths['/vegetables'];
      expect(pathCollection0).to.be.an('Object');

      expect(pathCollection0.delete).to.be.an('Object');
      expect(pathCollection0.delete.operationId).to.equal('deleteVegetableByQuery');
      expect(pathCollection0.delete.summary).to.equal('Delete some vegetables by query');
      expect(pathCollection0.delete.description).to.equal(
        'Delete all vegetables matching the specified query.'
      );
    });

    it('should generate the correct GET /vegetables/{id} operation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const pathInstance0 = body.paths['/vegetables/{id}'];
      expect(pathInstance0).to.be.an('Object');

      expect(pathInstance0.get).to.be.an('Object');

      expect(pathInstance0.get.tags).to.be.an('Array');
      expect(pathInstance0.get.operationId).to.equal('getVegetableById');
      expect(pathInstance0.get.summary).to.equal('Get a vegetable by its unique ID');
      expect(pathInstance0.get.description).to.equal('Retrieve a vegetable by its ID.');
      expect(pathInstance0.get.parameters).to.equal(undefined);
      expect(pathInstance0.get.responses).to.be.an('Object');
      expect(pathInstance0.get.security).to.equal(undefined);
    });

    it('should generate the correct PUT /vegetables/{id} operation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const pathInstance0 = body.paths['/vegetables/{id}'];
      expect(pathInstance0).to.be.an('Object');

      expect(pathInstance0.put).to.be.an('Object');

      expect(pathInstance0.put.operationId).to.equal('updateVegetable');
      expect(pathInstance0.put.summary).to.equal('Modify a vegetable by its unique ID');
      expect(pathInstance0.put.description).to.equal('Update an existing vegetable by its ID.');
    });
    it('should generate the correct DELETE /vegetables/{id} operation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const pathInstance0 = body.paths['/vegetables/{id}'];
      expect(pathInstance0).to.be.an('Object');

      expect(pathInstance0.delete.operationId).to.equal('deleteVegetableById');
      expect(pathInstance0.delete.summary).to.equal('Delete a vegetable by its unique ID');
      expect(pathInstance0.delete.description).to.equal('Deletes an existing vegetable by its ID.');
    });
  });

  describe('models', function() {
    it('should generate the correct model definitions', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.definitions.Vegetable).to.be.an('Object');
      expect(body.definitions.Vegetable.required.length).to.equal(1);
      expect(body.definitions.Vegetable.required[0]).to.equal('name');
      expect(body.definitions.Vegetable.properties.name.type).to.equal('string');
      expect(body.definitions.Vegetable.properties.related.$ref).to.equal(
        '#/definitions/Vegetable'
      );
      expect(body.definitions.Vegetable.properties._id.type).to.equal('string');
      expect(body.definitions.Vegetable.properties.__v.type).to.equal('number');
      expect(body.definitions.Vegetable.properties.__v.format).to.equal('int32');
      expect(body.definitions.Vegetable.properties.id.type).to.equal('string');
      expect(Object.keys(body.definitions.Vegetable.properties).length).to.equal(5);

      expect(body.definitions.Fungus).to.be.an('Object');
      expect(body.definitions.Fungus.required).to.equal(undefined);
      expect(body.definitions.Fungus.properties.dork.type).to.equal('boolean');
      expect(body.definitions.Fungus.properties._id.type).to.equal('string');
      expect(body.definitions.Fungus.properties.__v.type).to.equal('number');
      expect(body.definitions.Fungus.properties.__v.format).to.equal('int32');
      expect(body.definitions.Fungus.properties.id.type).to.equal('string');
      expect(Object.keys(body.definitions.Fungus.properties).length).to.equal(4);

      expect(body.definitions.Goose).to.be.an('Object');
      expect(body.definitions.Goose.required).to.equal(undefined);
      expect(body.definitions.Goose.properties.cooked.type).to.equal('boolean');
      expect(body.definitions.Goose.properties.stuffed.type).to.equal('array');
      expect(body.definitions.Goose.properties.stuffed.items.$ref).to.equal(
        '#/definitions/GooseStuffed'
      );
      expect(body.definitions.Goose.properties._id.type).to.equal('string');
      expect(body.definitions.Goose.properties.__v.type).to.equal('number');
      expect(body.definitions.Goose.properties.__v.format).to.equal('int32');
      expect(body.definitions.Goose.properties.id.type).to.equal('string');
      expect(body.definitions.Goose.properties.taste.type).to.equal('string');
      expect(Object.keys(body.definitions.Goose.properties).length).to.equal(6);

      expect(body.definitions.GooseStuffed).to.be.an('Object');
      expect(body.definitions.GooseStuffed.required).to.equal(undefined);
      expect(body.definitions.GooseStuffed.properties.bread.type).to.equal('boolean');
      expect(body.definitions.GooseStuffed.properties._id.type).to.equal('string');
      expect(body.definitions.GooseStuffed.properties.id.type).to.equal('string');
      expect(Object.keys(body.definitions.GooseStuffed.properties).length).to.equal(3);

      expect(body.definitions.ValidationError).to.be.an('Object');
      expect(body.definitions.ValidationError.required.length).to.equal(4);
      expect(body.definitions.ValidationError.required[0]).to.equal('message');
      expect(body.definitions.ValidationError.required[1]).to.equal('name');
      expect(body.definitions.ValidationError.required[2]).to.equal('kind');
      expect(body.definitions.ValidationError.required[3]).to.equal('path');
      expect(Object.keys(body.definitions.ValidationError.properties).length).to.equal(5);
      expect(body.definitions.ValidationError.properties.properties.$ref).to.equal(
        '#/definitions/ValidationErrorProperties'
      );
      expect(body.definitions.ValidationError.properties.message.type).to.equal('string');
      expect(body.definitions.ValidationError.properties.kind.type).to.equal('string');
      expect(body.definitions.ValidationError.properties.path.type).to.equal('string');

      expect(body.definitions.ValidationErrorProperties).to.be.an('Object');
      expect(body.definitions.ValidationErrorProperties.required.length).to.equal(3);
      expect(body.definitions.ValidationErrorProperties.required[0]).to.equal('type');
      expect(body.definitions.ValidationErrorProperties.required[1]).to.equal('message');
      expect(body.definitions.ValidationErrorProperties.required[2]).to.equal('path');
      expect(Object.keys(body.definitions.ValidationErrorProperties.properties).length).to.equal(3);
      expect(body.definitions.ValidationErrorProperties.properties.type.type).to.equal('string');
      expect(body.definitions.ValidationErrorProperties.properties.message.type).to.equal('string');
      expect(body.definitions.ValidationErrorProperties.properties.path.type).to.equal('string');
    });

    it('should generate embedded models correctly', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.definitions).to.have.property('Goose');
      expect(body.definitions).to.have.property('GooseStuffed');
      expect(body.definitions.Goose.properties).to.have.property('stuffed');
      expect(body.definitions.Goose.properties.stuffed.type).to.equal('array');
      expect(body.definitions.Goose.properties.stuffed.items.$ref).to.equal(
        '#/definitions/GooseStuffed'
      );
    });
  });

  describe('extensibility', function() {
    it("should copy all properties from the controller's swagger2 object", async function() {
      const {statusCode, body} = await request(getSwaggerOptions);
      expect(statusCode).to.equal(200);

      // forbidden extension
      expect(body).to.not.have.property('lambic');

      // allowed extensions
      expect(body.paths['/starkTrek']).to.be.an('Object');
      expect(body.paths['/starkTrek'].get.operationId).to.equal('enterprise');
      expect(body.definitions.Spook).to.be.an('Object');
    });

    it('should see overrided swagger definitions', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);
      expect(statusCode).to.equal(200);

      expect(body).to.have.property('host', 'api.acme.com:8012');
      expect(body).to.have.property('x-powered-by', 'baucis');
    });

    it('should allow adding custom APIs', async function() {
      fixtures.controller.swagger2.paths['/vegetables/best'] = {
        get: {
          operationId: 'getBestVegetable',
          summary: 'Get the best vegetable'
        }
      };
      fixtures.controller.swagger2.definitions.BestVegetable = {
        required: [],
        properties: {
          name: {
            type: 'string'
          }
        }
      };

      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);
      expect(body.paths).to.have.property('/vegetables/best');
      expect(body.definitions).to.have.property('BestVegetable');
    });

    it('should preserve extended root definitions', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);
      expect(body.definitions).to.have.property('customDefinition');
      expect(body.definitions.customDefinition).to.have.property('properties');
      expect(body.definitions.customDefinition.properties).to.have.property('a');
    });
  });

  describe('responses', function() {
    it('should generate the correct error responses', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      const instanceResponses = body.paths['/vegetables/{id}'].get.responses;
      expect(instanceResponses['404'].description).to.equal('No vegetable was found with that ID.');
      expect(instanceResponses['404'].schema.type).to.equal('string');
      expect(instanceResponses['200'].description).to.equal('Sucessful response. Single resource.');
      expect(instanceResponses['200'].schema.$ref).to.equal('#/definitions/Vegetable');
      expect(instanceResponses.default.description).to.equal('Unexpected error.');
      expect(instanceResponses.default.schema.type).to.equal('string');
      expect(Object.keys(instanceResponses).length).to.equal(3);

      const collectionResponses = body.paths['/vegetables'].post.responses;
      expect(collectionResponses['404'].description).to.equal('No vegetables matched that query.');
      expect(collectionResponses['404'].schema.type).to.equal('string');
      expect(collectionResponses['422'].description).to.equal('Validation error.');
      expect(collectionResponses['422'].schema.type).to.equal('array');
      expect(collectionResponses['422'].schema.items.$ref).to.equal(
        '#/definitions/ValidationError'
      );
      expect(collectionResponses['200'].description).to.equal(
        'Sucessful response. Single resource.'
      );
      expect(collectionResponses['200'].schema.$ref).to.equal('#/definitions/Vegetable');
      expect(collectionResponses.default.description).to.equal('Unexpected error.');
      expect(collectionResponses.default.schema.type).to.equal('string');
      expect(Object.keys(collectionResponses).length).to.equal(4);
    });

    it('post operation exposes 422 error for validation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);
      const operation = body.paths['/vegetables'].post;

      expect(operation).to.be.an('Object');
      expect(operation.responses).to.have.property('422');
      expect(operation.responses['422']).to.have.property('description', 'Validation error.');
      expect(operation.responses['422'].schema.type).to.equal('array');
      expect(operation.responses['422'].schema.items.$ref).to.equal(
        '#/definitions/ValidationError'
      );
    });

    it('put operation exposes 422 error for validation', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);
      const operation = body.paths['/vegetables/{id}'].put;

      expect(operation).to.be.an('Object');
      expect(operation.responses).to.have.property('422');
      expect(operation.responses['422']).to.have.property('description', 'Validation error.');
      expect(operation.responses['422'].schema.type).to.equal('array');
      expect(operation.responses['422'].schema.items.$ref).to.equal(
        '#/definitions/ValidationError'
      );
    });
  });

  describe('keep private data hidden', function() {
    it('should correctly set paths as private even if the path name contains hyphens', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);
      expect(body).to.have.property('definitions');
      expect(body.definitions).to.have.property('Fungus');
      expect(body.definitions.Fungus.properties).to.not.have.property('hyphenated-field-name');
      expect(body.definitions.Fungus.properties).to.not.have.property('password');
      expect(body.definitions.Fungus.properties).to.have.property('dork');
    });

    it('should keep paths deselected in the schema private', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.definitions).to.have.property('Vegetable');
      expect(body.definitions.Vegetable.properties).to.not.have.property('diseases');
      expect(body.definitions.Vegetable.properties).to.not.have.property('species');
    });

    it('should keep paths deselected in the controller private', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.definitions).to.have.property('Fungus');
      expect(body.definitions.Fungus.properties).to.not.have.property('hyphenated-field-name');
      expect(body.definitions.Fungus.properties).to.not.have.property('password');
    });
  });

  describe('parameters definition', function() {
    it('param skip is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      expect(body.parameters).to.be.an('Object');
      const param = body.parameters.skip;
      expect(param).to.have.property('name', 'skip');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'How many documents to skip. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdskip)'
      );
      expect(param).to.have.property('type', 'integer');
      expect(param).to.have.property('format', 'int32');
      expect(param).to.have.property('required', false);
    });

    it('param limit is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.limit;
      expect(param).to.have.property('name', 'limit');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'The maximum number of documents to send. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdlimit)'
      );
      expect(param).to.have.property('type', 'integer');
      expect(param).to.have.property('format', 'int32');
      expect(param).to.have.property('required', false);
    });
    it('param count is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.count;
      expect(param).to.have.property('name', 'count');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set to true to return count instead of documents. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdcount)'
      );
      expect(param).to.have.property('type', 'boolean');
      expect(param).to.have.property('required', false);
    });
    it('param conditions is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.conditions;
      expect(param).to.have.property('name', 'conditions');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set the conditions used to find or remove the document(s). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdconditions)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param sort is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.sort;

      expect(param).to.have.property('name', 'sort');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set the fields by which to sort. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdsort)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param select is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.select;

      expect(param).to.have.property('name', 'select');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Select which paths will be returned by the query. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdselect)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param populate is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.populate;

      expect(param).to.have.property('name', 'populate');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Specify which paths to populate. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdpopulate)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });
    it('param distinct is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.distinct;

      expect(param).to.have.property('name', 'distinct');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set to a path name to retrieve an array of distinct values. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mddistinct)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param hint is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.hint;

      expect(param).to.have.property('name', 'hint');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Add an index hint to the query (must be enabled per controller). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdhint)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param comment is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.comment;

      expect(param).to.have.property('name', 'comment');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Add a comment to a query (must be enabled per controller). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parametelrs.mdcomment)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param id is generated', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters.id;

      expect(param).to.have.property('name', 'id');
      expect(param).to.have.property('in', 'path');
      expect(param).to.have.property('description', 'The identifier of the resource.');
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', true);
    });

    it('param X-Baucis-Update-Operator is generated on put operation', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = body.parameters['X-Baucis-Update-Operator'];
      expect(param).to.have.property('name', 'X-Baucis-Update-Operator');
      expect(param).to.have.property('in', 'header');
      expect(param).to.have.property(
        'description',
        '**BYPASSES VALIDATION** May be used with PUT to update the document using $push, $pull, or $set. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/http-headers.md)'
      );
      expect(param).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });
  });

  describe('parameters usage', function() {
    it('param skip is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      expect(body.paths['/vegetables'].get.parameters).to.be.an('Array');
      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/parameters/skip'
      );
      expect(param).to.have.property('$ref', '#/parameters/skip');
    });
    it('param limit is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/parameters/limit'
      );
      expect(param).to.have.property('$ref', '#/parameters/limit');
    });
    it('param count is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/parameters/count'
      );
      expect(param).to.have.property('$ref', '#/parameters/count');
    });
    it('param conditions is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/parameters/conditions'
      );
      expect(param).to.have.property('$ref', '#/parameters/conditions');
    });
    it('param sort is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].parameters,
        '$ref',
        '#/parameters/sort'
      );
      expect(param).to.have.property('$ref', '#/parameters/sort');
    });
    it('param select is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].parameters,
        '$ref',
        '#/parameters/select'
      );
      expect(param).to.have.property('$ref', '#/parameters/select');
    });
    it('param populate is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].parameters,
        '$ref',
        '#/parameters/populate'
      );
      expect(param).to.have.property('$ref', '#/parameters/populate');
    });
    it('param distinct is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/parameters/distinct'
      );
      expect(param).to.have.property('$ref', '#/parameters/distinct');
    });
    it('param hint is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/parameters/hint'
      );
      expect(param).to.have.property('$ref', '#/parameters/hint');
    });
    it('param comment is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/parameters/comment'
      );
      expect(param).to.have.property('$ref', '#/parameters/comment');
    });

    it('param id is referenced', async function() {
      const {body} = await request(getSwaggerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables/{id}'].parameters,
        '$ref',
        '#/parameters/id'
      );
      expect(param).to.have.property('$ref', '#/parameters/id');
    });

    it('param document is generated', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.paths['/vegetables/{id}'].put.parameters).to.be.an('Array');
      const param = getItemFromArray(
        body.paths['/vegetables/{id}'].put.parameters,
        'name',
        'document'
      );
      expect(param).to.have.property('name', 'document');
      expect(param).to.have.property('in', 'body');
      expect(param).to.have.property(
        'description',
        'Update a document by sending the paths to be updated in the request body.'
      );
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('$ref', '#/definitions/Vegetable');
      expect(param).to.have.property('required', true);
    });
  });

  describe('tags', function() {
    it('tags are declared', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.tags).to.be.an('Array');
      expect(body.tags[0]).to.have.property('name', 'vegetable');
      expect(body.tags[0]).to.have.property('x-resource', true);
      expect(body.tags[1]).to.have.property('name', 'fungus');
      expect(body.tags[1]).to.have.property('x-resource', true);
      expect(body.tags[2]).to.have.property('name', 'goose');
      expect(body.tags[2]).to.have.property('x-resource', true);
    });

    it('tags labels operations operations', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.paths['/vegetables'].get.tags).to.be.an('Array');
      expect(body.paths['/vegetables'].get.tags[0]).to.equal('vegetable'); // resource
    });
  });

  describe('arrays', function() {
    it('recognizes Mongo array type', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.definitions).to.have.property('Goose');
      expect(body.definitions).to.have.property('GooseStuffed');
      expect(body.definitions.Goose.properties).to.have.property('stuffed');
      expect(body.definitions.Goose.properties.stuffed.type).to.equal('array');
      expect(body.definitions.Goose.properties.stuffed.items).to.have.property('$ref');
      expect(body.definitions.Goose.properties.stuffed.items.$ref).to.equal(
        '#/definitions/GooseStuffed'
      );
    });

    it('recognizes array of literals - string', async function() {
      const {body} = await request(getSwaggerOptions);

      expect(body.definitions.ChargeArea.properties).to.have.property('tags');
      expect(body.definitions.ChargeArea.properties.tags.type).to.equal('array');
      expect(body.definitions.ChargeArea.properties.tags.items).to.have.property('type');
      expect(body.definitions.ChargeArea.properties.tags.items.type).to.equal('string');
    });

    it('recognizes array of literals - number', async function() {
      const {body} = await request(getSwaggerOptions);

      expect(body.definitions.ChargeArea.properties).to.have.property('orders');
      expect(body.definitions.ChargeArea.properties.orders.type).to.equal('array');
      expect(body.definitions.ChargeArea.properties.orders.items).to.have.property('type');
      expect(body.definitions.ChargeArea.properties.orders.items.type).to.equal('number');
    });

    it('recognizes array of ObjectId exposing IDs as string', async function() {
      const {body} = await request(getSwaggerOptions);

      // credits to https://github.com/mdhooge for providing the repro-sample
      expect(body.definitions).to.have.property('ChargeArea');
      expect(body.definitions).to.have.property('ChargeCluster');

      expect(body.definitions.ChargeArea.properties).to.have.property('clusters');
      expect(body.definitions.ChargeArea.properties.clusters.type).to.equal('array');
      expect(body.definitions.ChargeArea.properties.clusters).to.have.property('items');
      expect(body.definitions.ChargeArea.properties.clusters.items).to.have.property('type');
      expect(body.definitions.ChargeArea.properties.clusters.items.type).to.equal('string'); // ids refs -> string
    });
  });

  describe('misc', function() {
    it('adds virtuals as model properties', async function() {
      const {statusCode, body} = await request(getSwaggerOptions);

      expect(statusCode).to.equal(200);

      expect(body.definitions.Vegetable).to.be.an('Object');
      expect(body.definitions.Vegetable.properties).to.have.property('id');
      expect(body.definitions.Vegetable.properties.id.type).to.equal('string');
    });
  });

  describe('pending - todo', function() {
    it('enum values');
    it('securityDefinitions is generated - via customization');
    it('security is generated - via customization');
    it('does not crash when a Mixed type is used');
  });
});
