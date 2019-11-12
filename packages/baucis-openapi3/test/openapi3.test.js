const fs = require('fs');
const {expect} = require('chai');
const request = require('request-promise');

const fixtures = require('./fixtures/vegetable');

const contractUrl = 'http://localhost:8012/api/openapi.json';
const getExplorerOptions = {
  uri: contractUrl,
  json: true
};

function getItemFromArray(array, selector, value) {
  for (const item in array) {
    if (array[item][selector] === value) {
      return array[item];
    }
  }
  return null;
}

describe('OpenAPI 3.0 Resources', function() {
  before(fixtures.init);
  beforeEach(fixtures.create);
  after(fixtures.deinit);

  describe('contract url', function() {
    it('should be exposed on: openapi.json', async function() {
      const body = await request(getExplorerOptions);
      expect(body).to.have.property('openapi', '3.0.0');
    });
    it('save sample contract to disk', async function() {
      const body = await request(getExplorerOptions);
      expect(body).to.have.property('openapi', '3.0.0');

      fs.writeFileSync('test/reference-contract.json', JSON.stringify(body, null, 2));
    });
  });

  describe('header info', function() {
    it('should generate the correct header', async function() {
      const body = await request(getExplorerOptions);

      expect(body).to.have.property('openapi', '3.0.0');
      expect(body).to.have.property('x-powered-by', 'baucis');

      expect(body).to.have.property('info');
      expect(body.info).to.have.property('title', 'my app');

      expect(body).to.have.property('paths');
      expect(body).to.have.property('components');

      // Check the API listing
      const paths = body.paths;
      expect(paths).to.be.an('Object');
      expect(body.components).to.be.an('Object');
      expect(body.components.schemas).to.be.an('Object');

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

    it('should generate no security info (to be added by customization)', async function() {
      const body = await request(getExplorerOptions);
      expect(body).to.have.property('openapi', '3.0.0');
      expect(body.security).to.equal(undefined);
    });
  });

  describe('paths', function() {
    it('should generate the correct GET /vegetables operation', async function() {
      const body = await request(getExplorerOptions);

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
      const body = await request(getExplorerOptions);

      const pathCollection0 = body.paths['/vegetables'];
      expect(pathCollection0).to.be.an('Object');
      expect(pathCollection0.post).to.be.an('Object');
      expect(pathCollection0.post.operationId).to.equal('createVegetable');
      expect(pathCollection0.post.summary).to.equal('Create some vegetables');
      expect(pathCollection0.post.description).to.equal('Create one or more vegetables.');
    });

    it('should generate unique names per operationId', async function() {
      const body = await request(getExplorerOptions);

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
      const body = await request(getExplorerOptions);

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
      const body = await request(getExplorerOptions);

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
      const body = await request(getExplorerOptions);

      const pathInstance0 = body.paths['/vegetables/{id}'];
      expect(pathInstance0).to.be.an('Object');

      expect(pathInstance0.put).to.be.an('Object');

      expect(pathInstance0.put.operationId).to.equal('updateVegetable');
      expect(pathInstance0.put.summary).to.equal('Modify a vegetable by its unique ID');
      expect(pathInstance0.put.description).to.equal('Update an existing vegetable by its ID.');
    });
    it('should generate the correct DELETE /vegetables/{id} operation', async function() {
      const body = await request(getExplorerOptions);

      const pathInstance0 = body.paths['/vegetables/{id}'];
      expect(pathInstance0).to.be.an('Object');

      expect(pathInstance0.delete.operationId).to.equal('deleteVegetableById');
      expect(pathInstance0.delete.summary).to.equal('Delete a vegetable by its unique ID');
      expect(pathInstance0.delete.description).to.equal('Deletes an existing vegetable by its ID.');
    });
    it('should not generate the DELETE /geese operation', async function() {
      const body = await request(getExplorerOptions);

      const pathCollection = body.paths['/geese'];
      expect(pathCollection).to.be.an('Object');
      expect(pathCollection.delete).to.equal(undefined);
      const pathInstance = body.paths['/geese/{id}'];
      expect(pathInstance).to.be.an('Object');
      expect(pathInstance.delete).to.equal(undefined);
    });
  });

  describe('models', function() {
    it('should generate the correct schema definitions', async function() {
      const body = await request(getExplorerOptions);
      expect(body.components.schemas.Vegetable).to.be.an('Object');
      expect(body.components.schemas.Vegetable.required.length).to.equal(1);
      expect(body.components.schemas.Vegetable.required[0]).to.equal('name');
      expect(body.components.schemas.Vegetable.properties.name.type).to.equal('string');
      expect(body.components.schemas.Vegetable.properties.related.$ref).to.equal(
        '#/components/schemas/Vegetable'
      );
      expect(body.components.schemas.Vegetable.properties._id.type).to.equal('string');
      expect(body.components.schemas.Vegetable.properties.__v.type).to.equal('number');
      expect(body.components.schemas.Vegetable.properties.__v.format).to.equal('int32');
      expect(body.components.schemas.Vegetable.properties.id.type).to.equal('string');
      expect(Object.keys(body.components.schemas.Vegetable.properties).length).to.equal(5);

      expect(body.components.schemas.Fungus).to.be.an('Object');
      expect(body.components.schemas.Fungus.required).to.equal(undefined);
      expect(body.components.schemas.Fungus.properties.dork.type).to.equal('boolean');
      expect(body.components.schemas.Fungus.properties._id.type).to.equal('string');
      expect(body.components.schemas.Fungus.properties.__v.type).to.equal('number');
      expect(body.components.schemas.Fungus.properties.__v.format).to.equal('int32');
      expect(body.components.schemas.Fungus.properties.id.type).to.equal('string');
      expect(Object.keys(body.components.schemas.Fungus.properties).length).to.equal(4);

      expect(body.components.schemas.Goose).to.be.an('Object');
      expect(body.components.schemas.Goose.required).to.equal(undefined);
      expect(body.components.schemas.Goose.properties.cooked.type).to.equal('boolean');
      expect(body.components.schemas.Goose.properties.stuffed.type).to.equal('array');
      expect(body.components.schemas.Goose.properties.stuffed.items.$ref).to.equal(
        '#/components/schemas/GooseStuffed'
      );
      expect(body.components.schemas.Goose.properties._id.type).to.equal('string');
      expect(body.components.schemas.Goose.properties.__v.type).to.equal('number');
      expect(body.components.schemas.Goose.properties.__v.format).to.equal('int32');
      expect(body.components.schemas.Goose.properties.id.type).to.equal('string');
      expect(Object.keys(body.components.schemas.Goose.properties).length).to.equal(5);

      expect(body.components.schemas.GooseStuffed).to.be.an('Object');
      expect(body.components.schemas.GooseStuffed.required).to.equal(undefined);
      expect(body.components.schemas.GooseStuffed.properties.bread.type).to.equal('boolean');
      expect(body.components.schemas.GooseStuffed.properties._id.type).to.equal('string');
      expect(body.components.schemas.GooseStuffed.properties.id.type).to.equal('string');
      expect(Object.keys(body.components.schemas.GooseStuffed.properties).length).to.equal(3);

      expect(body.components.schemas.ValidationError).to.be.an('Object');
      expect(body.components.schemas.ValidationError.required.length).to.equal(4);
      expect(body.components.schemas.ValidationError.required[0]).to.equal('message');
      expect(body.components.schemas.ValidationError.required[1]).to.equal('name');
      expect(body.components.schemas.ValidationError.required[2]).to.equal('kind');
      expect(body.components.schemas.ValidationError.required[3]).to.equal('path');
      expect(Object.keys(body.components.schemas.ValidationError.properties).length).to.equal(5);
      expect(body.components.schemas.ValidationError.properties.properties.$ref).to.equal(
        '#/components/schemas/ValidationErrorProperties'
      );
      expect(body.components.schemas.ValidationError.properties.message.type).to.equal('string');
      expect(body.components.schemas.ValidationError.properties.kind.type).to.equal('string');
      expect(body.components.schemas.ValidationError.properties.path.type).to.equal('string');

      expect(body.components.schemas.ValidationErrorProperties).to.be.an('Object');
      expect(body.components.schemas.ValidationErrorProperties.required.length).to.equal(3);
      expect(body.components.schemas.ValidationErrorProperties.required[0]).to.equal('type');
      expect(body.components.schemas.ValidationErrorProperties.required[1]).to.equal('message');
      expect(body.components.schemas.ValidationErrorProperties.required[2]).to.equal('path');
      expect(
        Object.keys(body.components.schemas.ValidationErrorProperties.properties).length
      ).to.equal(3);
      expect(body.components.schemas.ValidationErrorProperties.properties.type.type).to.equal(
        'string'
      );
      expect(body.components.schemas.ValidationErrorProperties.properties.message.type).to.equal(
        'string'
      );
      expect(body.components.schemas.ValidationErrorProperties.properties.path.type).to.equal(
        'string'
      );
    });

    it('should generate embedded models correctly', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.schemas).to.have.property('Goose');
      expect(body.components.schemas).to.have.property('GooseStuffed');
      expect(body.components.schemas.Goose.properties).to.have.property('stuffed');
      expect(body.components.schemas.Goose.properties.stuffed.type).to.equal('array');
      expect(body.components.schemas.Goose.properties.stuffed.items.$ref).to.equal(
        '#/components/schemas/GooseStuffed'
      );
    });
  });

  describe('extensibility', function() {
    it("should copy all properties from the controller's openApi3 object", async function() {
      const body = await request(getExplorerOptions);

      // forbidden extension
      expect(body).to.not.have.property('lambic');

      // allowed extensions
      expect(body.paths['/starkTrek']).to.be.an('Object');
      expect(body.paths['/starkTrek'].get.operationId).to.equal('enterprise');
      expect(body.components.schemas.Spook).to.be.an('Object');
    });

    it('should see overrided OpenAPI definitions', async function() {
      const body = await request(getExplorerOptions);
      expect(body).to.have.property('x-powered-by', 'baucis');
    });

    xit('should allow adding custom APIs dynamically (not supported yet)', async function() {
      fixtures.controller.openApi3.paths['/vegetables/best'] = {
        get: {
          operationId: 'getBestVegetable',
          summary: 'Get the best vegetable'
        }
      };
      fixtures.controller.openApi3.components.schemas.BestVegetable = {
        required: [],
        properties: {
          name: {
            type: 'string'
          }
        }
      };

      const body = await request(getExplorerOptions);
      expect(body.paths).to.have.property('/vegetables/best');
      expect(body.components.schemas).to.have.property('BestVegetable');
    });

    it('should preserve extended root definitions', async function() {
      const body = await request(getExplorerOptions);
      expect(body.components.schemas).to.have.property('customDefinition');
      expect(body.components.schemas.customDefinition).to.have.property('properties');
      expect(body.components.schemas.customDefinition.properties).to.have.property('a');
    });
  });

  describe('requestBodies', function() {
    it('should generate the correct requesBody in put operation', async function() {
      const body = await request(getExplorerOptions);
      const rBody = body.paths['/vegetables/{id}'].put.requestBody;

      expect(rBody).to.have.property('content');
      expect(rBody).to.have.property('description');
      expect(rBody.content).to.have.property('application/json');
      expect(rBody.content['application/json']).to.have.property('schema');
      expect(rBody.content['application/json'].schema.$ref).to.equal(
        '#/components/schemas/Vegetable'
      );
    });
  });

  describe('responses', function() {
    it('should generate the correct error responses', async function() {
      const body = await request(getExplorerOptions);

      const instanceResponses = body.paths['/vegetables/{id}'].get.responses;
      expect(instanceResponses['404'].description).to.equal('No vegetable was found with that ID.');

      expect(instanceResponses['404'].content['application/json'].schema.type).to.equal('string');
      expect(instanceResponses['200'].description).to.equal('Sucessful response. Single resource.');
      expect(instanceResponses['200'].content['application/json'].schema.$ref).to.equal(
        '#/components/schemas/Vegetable'
      );
      expect(instanceResponses.default.description).to.equal('Unexpected error.');
      expect(instanceResponses.default.content['application/json'].schema.type).to.equal('string');
      expect(Object.keys(instanceResponses).length).to.equal(3);

      const collectionResponses = body.paths['/vegetables'].post.responses;
      expect(collectionResponses['404'].description).to.equal('No vegetables matched that query.');
      expect(collectionResponses['404'].content['application/json'].schema.type).to.equal('string');
      expect(collectionResponses['422'].description).to.equal('Validation error.');
      expect(collectionResponses['422'].content['application/json'].schema.type).to.equal('array');
      expect(collectionResponses['422'].content['application/json'].schema.items.$ref).to.equal(
        '#/components/schemas/ValidationError'
      );
      expect(collectionResponses['200'].description).to.equal(
        'Sucessful response. Single resource.'
      );
      expect(collectionResponses['200'].content['application/json'].schema.$ref).to.equal(
        '#/components/schemas/Vegetable'
      );
      expect(collectionResponses.default.description).to.equal('Unexpected error.');
      expect(collectionResponses.default.content['application/json'].schema.type).to.equal(
        'string'
      );
      expect(Object.keys(collectionResponses).length).to.equal(4);
    });

    it('post operation exposes 422 error for validation', async function() {
      const body = await request(getExplorerOptions);
      const operation = body.paths['/vegetables'].post;

      expect(operation).to.be.an('Object');
      expect(operation.responses).to.have.property('422');
      expect(operation.responses['422']).to.have.property('description', 'Validation error.');
      expect(operation.responses['422'].content['application/json'].schema.type).to.equal('array');
      expect(operation.responses['422'].content['application/json'].schema.items.$ref).to.equal(
        '#/components/schemas/ValidationError'
      );
    });

    it('put operation exposes 422 error for validation', async function() {
      const body = await request(getExplorerOptions);
      const operation = body.paths['/vegetables/{id}'].put;

      expect(operation).to.be.an('Object');
      expect(operation.responses).to.have.property('422');
      expect(operation.responses['422']).to.have.property('description', 'Validation error.');
      expect(operation.responses['422'].content['application/json'].schema.type).to.equal('array');
      expect(operation.responses['422'].content['application/json'].schema.items.$ref).to.equal(
        '#/components/schemas/ValidationError'
      );
    });
  });

  describe('keep private data hidden', function() {
    it('should correctly set paths as private even if the path name contains hyphens', async function() {
      const body = await request(getExplorerOptions);
      expect(body.components.schemas).to.have.property('Fungus');
      expect(body.components.schemas.Fungus.properties).to.not.have.property(
        'hyphenated-field-name'
      );
      expect(body.components.schemas.Fungus.properties).to.not.have.property('password');
      expect(body.components.schemas.Fungus.properties).to.have.property('dork');
    });

    it('should keep paths deselected in the schema private', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.schemas).to.have.property('Vegetable');
      expect(body.components.schemas.Vegetable.properties).to.not.have.property('diseases');
      expect(body.components.schemas.Vegetable.properties).to.not.have.property('species');
    });

    it('should keep paths deselected in the controller private', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.schemas).to.have.property('Fungus');
      expect(body.components.schemas.Fungus.properties).to.not.have.property(
        'hyphenated-field-name'
      );
      expect(body.components.schemas.Fungus.properties).to.not.have.property('password');
    });
  });

  describe('parameters definition', function() {
    it('param skip is generated', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.parameters).to.be.an('Object');
      const param = body.components.parameters.skip;
      expect(param).to.have.property('name', 'skip');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'How many documents to skip. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#skip)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'integer');
      expect(param.schema).to.have.property('format', 'int32');
      expect(param).to.have.property('required', false);
    });

    it('param limit is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.limit;
      expect(param).to.have.property('name', 'limit');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'The maximum number of documents to send. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#limit)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'integer');
      expect(param.schema).to.have.property('format', 'int32');
      expect(param).to.have.property('required', false);
    });
    it('param count is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.count;
      expect(param).to.have.property('name', 'count');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set to true to return count instead of documents. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#count)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'boolean');
      expect(param).to.have.property('required', false);
    });
    it('param conditions is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.conditions;
      expect(param).to.have.property('name', 'conditions');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set the conditions used to find or remove the document(s). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#conditions)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param sort is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.sort;

      expect(param).to.have.property('name', 'sort');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set the fields by which to sort. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#sort)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param select is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.select;

      expect(param).to.have.property('name', 'select');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Select which paths will be returned by the query. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#select)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param populate is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.populate;

      expect(param).to.have.property('name', 'populate');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Specify which paths to populate. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#populate)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });
    it('param distinct is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.distinct;

      expect(param).to.have.property('name', 'distinct');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Set to a path name to retrieve an array of distinct values. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#distinct)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param hint is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.hint;

      expect(param).to.have.property('name', 'hint');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Add an index hint to the query (must be enabled per controller). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#hint)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param comment is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.comment;

      expect(param).to.have.property('name', 'comment');
      expect(param).to.have.property('in', 'query');
      expect(param).to.have.property(
        'description',
        'Add a comment to a query (must be enabled per controller). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#comment)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });

    it('param id is generated', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters.id;

      expect(param).to.have.property('name', 'id');
      expect(param).to.have.property('in', 'path');
      expect(param).to.have.property('description', 'The identifier of the resource.');
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', true);
    });

    it('param X-Baucis-Update-Operator is generated on put operation', async function() {
      const body = await request(getExplorerOptions);

      const param = body.components.parameters['X-Baucis-Update-Operator'];
      expect(param).to.have.property('name', 'X-Baucis-Update-Operator');
      expect(param).to.have.property('in', 'header');
      expect(param).to.have.property(
        'description',
        '**BYPASSES VALIDATION** May be used with PUT to update the document using $push, $pull, or $set. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/http-headers.md)'
      );
      expect(param).to.not.have.property('type'); // v2
      expect(param).to.have.property('schema');
      expect(param.schema).to.have.property('type', 'string');
      expect(param).to.have.property('required', false);
    });
  });

  describe('parameters usage', function() {
    it('param skip is referenced', async function() {
      const body = await request(getExplorerOptions);

      expect(body.paths['/vegetables'].get.parameters).to.be.an('Array');
      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/components/parameters/skip'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/skip');
    });
    it('param limit is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/components/parameters/limit'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/limit');
    });
    it('param count is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/components/parameters/count'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/count');
    });
    it('param conditions is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/components/parameters/conditions'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/conditions');
    });
    it('param sort is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].parameters,
        '$ref',
        '#/components/parameters/sort'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/sort');
    });
    it('param select is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].parameters,
        '$ref',
        '#/components/parameters/select'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/select');
    });
    it('param populate is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].parameters,
        '$ref',
        '#/components/parameters/populate'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/populate');
    });
    it('param distinct is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/components/parameters/distinct'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/distinct');
    });
    it('param hint is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/components/parameters/hint'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/hint');
    });
    it('param comment is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables'].get.parameters,
        '$ref',
        '#/components/parameters/comment'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/comment');
    });

    it('param id is referenced', async function() {
      const body = await request(getExplorerOptions);

      const param = getItemFromArray(
        body.paths['/vegetables/{id}'].parameters,
        '$ref',
        '#/components/parameters/id'
      );
      expect(param).to.have.property('$ref', '#/components/parameters/id');
    });
  });

  describe('tags', function() {
    it('tags are declared', async function() {
      const body = await request(getExplorerOptions);

      expect(body.tags).to.be.an('Array');
      expect(body.tags[0]).to.have.property('name', 'vegetable');
      expect(body.tags[0]).to.have.property('x-resource', true);
      expect(body.tags[1]).to.have.property('name', 'fungus');
      expect(body.tags[1]).to.have.property('x-resource', true);
      expect(body.tags[2]).to.have.property('name', 'goose');
      expect(body.tags[2]).to.have.property('x-resource', true);
    });

    it('tags labels operations operations', async function() {
      const body = await request(getExplorerOptions);

      expect(body.paths['/vegetables'].get.tags).to.be.an('Array');
      expect(body.paths['/vegetables'].get.tags[0]).to.equal('vegetable'); // resource
    });
  });

  describe('arrays', function() {
    it('recognizes Mongo array type', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.schemas).to.have.property('Goose');
      expect(body.components.schemas).to.have.property('GooseStuffed');
      expect(body.components.schemas.Goose.properties).to.have.property('stuffed');
      expect(body.components.schemas.Goose.properties.stuffed.type).to.equal('array');
      expect(body.components.schemas.Goose.properties.stuffed.items).to.have.property('$ref');
      expect(body.components.schemas.Goose.properties.stuffed.items.$ref).to.equal(
        '#/components/schemas/GooseStuffed'
      );
    });

    it('recognizes array of literals - string', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.schemas.ChargeArea.properties).to.have.property('tags');
      expect(body.components.schemas.ChargeArea.properties.tags.type).to.equal('array');
      expect(body.components.schemas.ChargeArea.properties.tags.items).to.have.property('type');
      expect(body.components.schemas.ChargeArea.properties.tags.items.type).to.equal('string');
    });

    it('recognizes array of literals - number', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.schemas.ChargeArea.properties).to.have.property('orders');
      expect(body.components.schemas.ChargeArea.properties.orders.type).to.equal('array');
      expect(body.components.schemas.ChargeArea.properties.orders.items).to.have.property('type');
      expect(body.components.schemas.ChargeArea.properties.orders.items.type).to.equal('number');
    });

    it('recognizes array of ObjectId exposing IDs as string', async function() {
      const body = await request(getExplorerOptions);

      // credits to https://github.com/mdhooge for providing the repro-sample
      expect(body.components.schemas).to.have.property('ChargeArea');
      expect(body.components.schemas).to.have.property('ChargeCluster');

      expect(body.components.schemas.ChargeArea.properties).to.have.property('clusters');
      expect(body.components.schemas.ChargeArea.properties.clusters.type).to.equal('array');
      expect(body.components.schemas.ChargeArea.properties.clusters).to.have.property('items');
      expect(body.components.schemas.ChargeArea.properties.clusters.items).to.have.property('type');
      expect(body.components.schemas.ChargeArea.properties.clusters.items.type).to.equal('string'); // ids refs -> string
    });
  });

  describe('misc', function() {
    it('adds virtuals as model properties', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.schemas.Vegetable).to.be.an('Object');
      expect(body.components.schemas.Vegetable.properties).to.have.property('id');
      expect(body.components.schemas.Vegetable.properties.id.type).to.equal('string');
    });
  });

  describe('custom options via optionsBuilder', function() {
    it('title', async function() {
      const body = await request(getExplorerOptions);

      expect(body.info.title).eql('my app');
    });
    it('version', async function() {
      const body = await request(getExplorerOptions);

      expect(body.info.version).eql('3.14.15');
    });
    it('description', async function() {
      const body = await request(getExplorerOptions);

      expect(body.info.description).eql('OpenAPI 3.0.0-RC implementors sample doc.');
    });
    it('contact', async function() {
      const body = await request(getExplorerOptions);

      expect(body.info.contact).eql({
        name: 'Pedro J. Molina',
        url: 'http://pjmolina.com',
        email: 'pjmolina@acme.com'
      });
    });
    it('license', async function() {
      const body = await request(getExplorerOptions);

      expect(body.info.license).eql({
        name: 'Apache 2',
        url: 'http://apache.org'
      });
    });
    it('termsOfService', async function() {
      const body = await request(getExplorerOptions);

      expect(body.info.termsOfService).eql('My TOS');
    });
    it('servers are present', async function() {
      const body = await request(getExplorerOptions);

      expect(body.servers).to.be.an('Array');
      expect(body.servers[0].url).eql('http://api1.acme.com');
      expect(body.servers[0].description).eql('My prod server');
      expect(body.servers[0].variables.user.default).eql('alicia');
      expect(body.servers[0].variables.user.enum).eql(['demo', 'joe', 'alicia']);
      expect(body.servers[0].variables.user.description).eql('User name for authentication.');
      expect(body.servers[0].variables.env.default).eql('qa');
      expect(body.servers[0].variables.env.enum).eql(['dev', 'qa', 'prod']);
    });
    it('SecuritySchemeBasicAuth is present', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.securitySchemes.authentication_basic).eql({
        type: 'http',
        scheme: 'basic'
      });
    });
    it('SecurityJWT is present', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.securitySchemes.autentication_jwt).eql({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      });
    });
    it('SecuritySchemeApiKey is present', async function() {
      const body = await request(getExplorerOptions);

      expect(body.components.securitySchemes.authentication_apikey).eql({
        type: 'apiKey',
        name: 'authentication_apikey',
        in: 'header'
      });
    });
  });

  describe('pending - todo', function() {
    it('enum values');
    it('securityDefinitions is generated - via customization');
    it('security is generated - via customization');
    it('does not crash when a Mixed type is used');
    it('and more...');
  });
});
