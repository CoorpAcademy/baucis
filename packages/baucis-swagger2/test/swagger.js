const expect = require('expect.js');
const request = require('request');
const baucis = require('@coorpacademy/baucis');

const fixtures = require('./fixtures/vegetable');

function getItemFromArray(array, selector, value) {
  for (const item in array) {
    if (array[item][selector] === value) {
      return array[item];
    }
  }
  return null;
}

describe('Swagger 2.0 Resources', function() {
  before(fixtures.init);
  beforeEach(fixtures.create);
  after(fixtures.deinit);

  describe('header info', function() {
    it('should generate the correct header', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);
        expect(body.info).to.have.property('version', '0.0.1');
        expect(body).to.have.property('swagger', '2.0');
        expect(body).to.have.property('basePath', '/api');
        expect(body).to.have.property('host', 'api.acme.com:8012');
        expect(body).to.have.property('x-powered-by', 'baucis');

        expect(body).to.have.property('paths');

        expect(body.tags).to.be.an(Array);
        expect(body.schemes).to.be.an(Array);
        expect(body.schemes[0]).to.be('http');
        expect(body.schemes[1]).to.be('https');

        expect(body.consumes).to.be.an(Array);
        expect(body.consumes.length).to.be(1);
        expect(body.consumes[0]).to.be('application/json');

        expect(body.produces).to.be.an(Array);
        expect(body.produces.length).to.be(2);
        expect(body.produces[0]).to.be('application/json');
        expect(body.produces[1]).to.be('text/html');

        // Check the API listing
        const paths = body.paths;
        expect(paths).to.be.an(Object);
        expect(body.definitions).to.be.an(Object);

        const pathInstance0 = body.paths['/vegetables/{id}'];
        expect(pathInstance0).to.be.an(Object);

        expect(pathInstance0.get).to.be.an(Object);
        expect(pathInstance0.put).to.be.an(Object);
        expect(pathInstance0.delete).to.be.an(Object);

        expect(pathInstance0.get.tags).to.be.an(Array);
        expect(pathInstance0.get.operationId).to.be('getVegetableById');
        expect(pathInstance0.get.summary).to.be('Get a vegetable by its unique ID');
        expect(pathInstance0.get.description).to.be('Retrieve a vegetable by its ID.');
        expect(pathInstance0.get.parameters).to.be(undefined);
        expect(pathInstance0.get.responses).to.be.an(Object);
        expect(pathInstance0.get.security).to.be(undefined);

        expect(pathInstance0.put.operationId).to.be('updateVegetable');
        expect(pathInstance0.put.summary).to.be('Modify a vegetable by its unique ID');
        expect(pathInstance0.put.description).to.be('Update an existing vegetable by its ID.');

        expect(pathInstance0.delete.operationId).to.be('deleteVegetableById');
        expect(pathInstance0.delete.summary).to.be('Delete a vegetable by its unique ID');
        expect(pathInstance0.delete.description).to.be('Deletes an existing vegetable by its ID.');

        const pathCollection0 = body.paths['/vegetables'];
        expect(pathCollection0).to.be.an(Object);

        expect(pathCollection0.get).to.be.an(Object);
        expect(pathCollection0.post).to.be.an(Object);
        expect(pathCollection0.delete).to.be.an(Object);

        expect(pathCollection0.get.tags).to.be.an(Array);
        expect(pathCollection0.get.operationId).to.be('queryVegetable');
        expect(pathCollection0.get.summary).to.be('Query some vegetables');
        expect(pathCollection0.get.description).to.be('Query over vegetables.');
        expect(pathCollection0.get.parameters).to.be.an(Array);
        expect(pathCollection0.get.responses).to.be.an(Object);
        expect(pathCollection0.get.security).to.be(undefined);

        expect(pathCollection0.post.operationId).to.be('createVegetable');
        expect(pathCollection0.post.summary).to.be('Create some vegetables');
        expect(pathCollection0.post.description).to.be('Create one or more vegetables.');

        expect(pathCollection0.delete.operationId).to.be('deleteVegetableByQuery');
        expect(pathCollection0.delete.summary).to.be('Delete some vegetables by query');
        expect(pathCollection0.delete.description).to.be(
          'Delete all vegetables matching the specified query.'
        );

        done();
      });
    });

    it('should generate no security info (to be added by customization)', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);
        expect(body).to.have.property('swagger', '2.0');
        expect(body.security).to.be(undefined);
        expect(body.securityDefinitions).to.be(undefined);
        done();
      });
    });
  });

  describe('paths', function() {
    it('should generate the correct GET /vegetables operation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const pathCollection0 = body.paths['/vegetables'];
        expect(pathCollection0).to.be.an(Object);

        expect(pathCollection0.get).to.be.an(Object);
        expect(pathCollection0.get.tags).to.be.an(Array);
        expect(pathCollection0.get.operationId).to.be('queryVegetable');
        expect(pathCollection0.get.summary).to.be('Query some vegetables');
        expect(pathCollection0.get.description).to.be('Query over vegetables.');
        expect(pathCollection0.get.parameters).to.be.an(Array);
        expect(pathCollection0.get.responses).to.be.an(Object);
        expect(pathCollection0.get.security).to.be(undefined);

        done();
      });
    });

    it('should generate the correct POST /vegetables operation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const pathCollection0 = body.paths['/vegetables'];
        expect(pathCollection0).to.be.an(Object);
        expect(pathCollection0.post).to.be.an(Object);
        expect(pathCollection0.post.operationId).to.be('createVegetable');
        expect(pathCollection0.post.summary).to.be('Create some vegetables');
        expect(pathCollection0.post.description).to.be('Create one or more vegetables.');

        done();
      });
    });

    it('should generate unique names per operationId', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const pathCollection0 = body.paths['/vegetables'];
        expect(pathCollection0.post.operationId).to.be('createVegetable');
        expect(pathCollection0.delete.operationId).to.be('deleteVegetableByQuery');
        expect(pathCollection0.get.operationId).to.be('queryVegetable');

        const pathInstance0 = body.paths['/vegetables/{id}'];
        expect(pathInstance0.put.operationId).to.be('updateVegetable');
        expect(pathInstance0.delete.operationId).to.be('deleteVegetableById');
        expect(pathInstance0.get.operationId).to.be('getVegetableById');

        done();
      });
    });

    it('should generate the correct DELETE /vegetables operation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const pathCollection0 = body.paths['/vegetables'];
        expect(pathCollection0).to.be.an(Object);

        expect(pathCollection0.delete).to.be.an(Object);
        expect(pathCollection0.delete.operationId).to.be('deleteVegetableByQuery');
        expect(pathCollection0.delete.summary).to.be('Delete some vegetables by query');
        expect(pathCollection0.delete.description).to.be(
          'Delete all vegetables matching the specified query.'
        );

        done();
      });
    });

    it('should generate the correct GET /vegetables/{id} operation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const pathInstance0 = body.paths['/vegetables/{id}'];
        expect(pathInstance0).to.be.an(Object);

        expect(pathInstance0.get).to.be.an(Object);

        expect(pathInstance0.get.tags).to.be.an(Array);
        expect(pathInstance0.get.operationId).to.be('getVegetableById');
        expect(pathInstance0.get.summary).to.be('Get a vegetable by its unique ID');
        expect(pathInstance0.get.description).to.be('Retrieve a vegetable by its ID.');
        expect(pathInstance0.get.parameters).to.be(undefined);
        expect(pathInstance0.get.responses).to.be.an(Object);
        expect(pathInstance0.get.security).to.be(undefined);

        done();
      });
    });

    it('should generate the correct PUT /vegetables/{id} operation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const pathInstance0 = body.paths['/vegetables/{id}'];
        expect(pathInstance0).to.be.an(Object);

        expect(pathInstance0.put).to.be.an(Object);

        expect(pathInstance0.put.operationId).to.be('updateVegetable');
        expect(pathInstance0.put.summary).to.be('Modify a vegetable by its unique ID');
        expect(pathInstance0.put.description).to.be('Update an existing vegetable by its ID.');

        done();
      });
    });
    it('should generate the correct DELETE /vegetables/{id} operation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const pathInstance0 = body.paths['/vegetables/{id}'];
        expect(pathInstance0).to.be.an(Object);

        expect(pathInstance0.delete.operationId).to.be('deleteVegetableById');
        expect(pathInstance0.delete.summary).to.be('Delete a vegetable by its unique ID');
        expect(pathInstance0.delete.description).to.be('Deletes an existing vegetable by its ID.');

        done();
      });
    });
  });

  describe('models', function() {
    it('should generate the correct model definitions', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.definitions.Vegetable).to.be.an(Object);
        expect(body.definitions.Vegetable.required.length).to.be(1);
        expect(body.definitions.Vegetable.required[0]).to.be('name');
        expect(body.definitions.Vegetable.properties.name.type).to.be('string');
        expect(body.definitions.Vegetable.properties.related.$ref).to.be('#/definitions/Vegetable');
        expect(body.definitions.Vegetable.properties._id.type).to.be('string');
        expect(body.definitions.Vegetable.properties.__v.type).to.be('number');
        expect(body.definitions.Vegetable.properties.__v.format).to.be('int32');
        expect(body.definitions.Vegetable.properties.id.type).to.be('string');
        expect(Object.keys(body.definitions.Vegetable.properties).length).to.be(5);

        expect(body.definitions.Fungus).to.be.an(Object);
        expect(body.definitions.Fungus.required).to.be(undefined);
        expect(body.definitions.Fungus.properties.dork.type).to.be('boolean');
        expect(body.definitions.Fungus.properties._id.type).to.be('string');
        expect(body.definitions.Fungus.properties.__v.type).to.be('number');
        expect(body.definitions.Fungus.properties.__v.format).to.be('int32');
        expect(body.definitions.Fungus.properties.id.type).to.be('string');
        expect(Object.keys(body.definitions.Fungus.properties).length).to.be(4);

        expect(body.definitions.Goose).to.be.an(Object);
        expect(body.definitions.Goose.required).to.be(undefined);
        expect(body.definitions.Goose.properties.cooked.type).to.be('boolean');
        expect(body.definitions.Goose.properties.stuffed.type).to.be('array');
        expect(body.definitions.Goose.properties.stuffed.items.$ref).to.be(
          '#/definitions/GooseStuffed'
        );
        expect(body.definitions.Goose.properties._id.type).to.be('string');
        expect(body.definitions.Goose.properties.__v.type).to.be('number');
        expect(body.definitions.Goose.properties.__v.format).to.be('int32');
        expect(body.definitions.Goose.properties.id.type).to.be('string');
        expect(Object.keys(body.definitions.Goose.properties).length).to.be(5);

        expect(body.definitions.GooseStuffed).to.be.an(Object);
        expect(body.definitions.GooseStuffed.required).to.be(undefined);
        expect(body.definitions.GooseStuffed.properties.bread.type).to.be('boolean');
        expect(body.definitions.GooseStuffed.properties._id.type).to.be('string');
        expect(body.definitions.GooseStuffed.properties.id.type).to.be('string');
        expect(Object.keys(body.definitions.GooseStuffed.properties).length).to.be(3);

        expect(body.definitions.ValidationError).to.be.an(Object);
        expect(body.definitions.ValidationError.required.length).to.be(4);
        expect(body.definitions.ValidationError.required[0]).to.be('message');
        expect(body.definitions.ValidationError.required[1]).to.be('name');
        expect(body.definitions.ValidationError.required[2]).to.be('kind');
        expect(body.definitions.ValidationError.required[3]).to.be('path');
        expect(Object.keys(body.definitions.ValidationError.properties).length).to.be(5);
        expect(body.definitions.ValidationError.properties.properties.$ref).to.be(
          '#/definitions/ValidationErrorProperties'
        );
        expect(body.definitions.ValidationError.properties.message.type).to.be('string');
        expect(body.definitions.ValidationError.properties.kind.type).to.be('string');
        expect(body.definitions.ValidationError.properties.path.type).to.be('string');

        expect(body.definitions.ValidationErrorProperties).to.be.an(Object);
        expect(body.definitions.ValidationErrorProperties.required.length).to.be(3);
        expect(body.definitions.ValidationErrorProperties.required[0]).to.be('type');
        expect(body.definitions.ValidationErrorProperties.required[1]).to.be('message');
        expect(body.definitions.ValidationErrorProperties.required[2]).to.be('path');
        expect(Object.keys(body.definitions.ValidationErrorProperties.properties).length).to.be(3);
        expect(body.definitions.ValidationErrorProperties.properties.type.type).to.be('string');
        expect(body.definitions.ValidationErrorProperties.properties.message.type).to.be('string');
        expect(body.definitions.ValidationErrorProperties.properties.path.type).to.be('string');

        done();
      });
    });

    it('should generate embedded models correctly', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.definitions).to.have.property('Goose');
        expect(body.definitions).to.have.property('GooseStuffed');
        expect(body.definitions.Goose.properties).to.have.property('stuffed');
        expect(body.definitions.Goose.properties.stuffed.type).to.be('array');
        expect(body.definitions.Goose.properties.stuffed.items.$ref).to.be(
          '#/definitions/GooseStuffed'
        );

        done();
      });
    });
  });

  describe('extensibility', function() {
    it("should copy all properties from the controller's swagger2 object", function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);
        expect(response).to.have.property('statusCode', 200);

        // forbidden extension
        expect(body).to.not.have.property('lambic');

        // allowed extensions
        expect(body.paths['/starkTrek']).to.be.an(Object);
        expect(body.paths['/starkTrek'].get.operationId).to.be('enterprise');
        expect(body.definitions.Spook).to.be.an(Object);

        done();
      });
    });

    it('should see overrided swagger definitions', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);
        expect(response).to.have.property('statusCode', 200);

        expect(body).to.have.property('host', 'api.acme.com:8012');
        expect(body).to.have.property('x-powered-by', 'baucis');

        done();
      });
    });

    it('should allow adding custom APIs', function(done) {
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

      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);
        expect(body.paths).to.have.property('/vegetables/best');
        expect(body.definitions).to.have.property('BestVegetable');

        done();
      });
    });

    it('should preserve extended root definitions', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);
        expect(body.definitions).to.have.property('customDefinition');
        expect(body.definitions.customDefinition).to.have.property('properties');
        expect(body.definitions.customDefinition.properties).to.have.property('a');

        done();
      });
    });
  });

  describe('responses', function() {
    it('should generate the correct error responses', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        const instanceResponses = body.paths['/vegetables/{id}'].get.responses;
        expect(instanceResponses['404'].description).to.be('No vegetable was found with that ID.');
        expect(instanceResponses['404'].schema.type).to.be('string');
        expect(instanceResponses['200'].description).to.be('Sucessful response. Single resource.');
        expect(instanceResponses['200'].schema.$ref).to.be('#/definitions/Vegetable');
        expect(instanceResponses.default.description).to.be('Unexpected error.');
        expect(instanceResponses.default.schema.type).to.be('string');
        expect(Object.keys(instanceResponses).length).to.be(3);

        const collectionResponses = body.paths['/vegetables'].post.responses;
        expect(collectionResponses['404'].description).to.be('No vegetables matched that query.');
        expect(collectionResponses['404'].schema.type).to.be('string');
        expect(collectionResponses['422'].description).to.be('Validation error.');
        expect(collectionResponses['422'].schema.type).to.be('array');
        expect(collectionResponses['422'].schema.items.$ref).to.be('#/definitions/ValidationError');
        expect(collectionResponses['200'].description).to.be(
          'Sucessful response. Single resource.'
        );
        expect(collectionResponses['200'].schema.$ref).to.be('#/definitions/Vegetable');
        expect(collectionResponses.default.description).to.be('Unexpected error.');
        expect(collectionResponses.default.schema.type).to.be('string');
        expect(Object.keys(collectionResponses).length).to.be(4);

        done();
      });
    });

    it('post operation exposes 422 error for validation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);
        const operation = body.paths['/vegetables'].post;

        expect(operation).to.be.an(Object);
        expect(operation.responses).to.have.property('422');
        expect(operation.responses['422']).to.have.property('description', 'Validation error.');
        expect(operation.responses['422'].schema.type).to.be('array');
        expect(operation.responses['422'].schema.items.$ref).to.be('#/definitions/ValidationError');

        done();
      });
    });

    it('put operation exposes 422 error for validation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);
        const operation = body.paths['/vegetables/{id}'].put;

        expect(operation).to.be.an(Object);
        expect(operation.responses).to.have.property('422');
        expect(operation.responses['422']).to.have.property('description', 'Validation error.');
        expect(operation.responses['422'].schema.type).to.be('array');
        expect(operation.responses['422'].schema.items.$ref).to.be('#/definitions/ValidationError');

        done();
      });
    });
  });

  describe('keep private data hidden', function() {
    it('should correctly set paths as private even if the path name contains hyphens', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);
        expect(body).to.have.property('definitions');
        expect(body.definitions).to.have.property('Fungus');
        expect(body.definitions.Fungus.properties).to.not.have.property('hyphenated-field-name');
        expect(body.definitions.Fungus.properties).to.not.have.property('password');
        expect(body.definitions.Fungus.properties).to.have.property('dork');
        done();
      });
    });

    it('should keep paths deselected in the schema private', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.definitions).to.have.property('Vegetable');
        expect(body.definitions.Vegetable.properties).to.not.have.property('diseases');
        expect(body.definitions.Vegetable.properties).to.not.have.property('species');

        done();
      });
    });

    it('should keep paths deselected in the controller private', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.definitions).to.have.property('Fungus');
        expect(body.definitions.Fungus.properties).to.not.have.property('hyphenated-field-name');
        expect(body.definitions.Fungus.properties).to.not.have.property('password');

        done();
      });
    });
  });

  describe('parameters definition', function(done) {
    it('param skip is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(body.parameters).to.be.an(Object);
        const param = body.parameters.skip;
        expect(param).to.have.property('name', 'skip');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'How many documents to skip. [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#skip)'
        );
        expect(param).to.have.property('type', 'integer');
        expect(param).to.have.property('format', 'int32');
        expect(param).to.have.property('required', false);

        done();
      });
    });

    it('param limit is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.limit;
        expect(param).to.have.property('name', 'limit');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'The maximum number of documents to send. [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#limit)'
        );
        expect(param).to.have.property('type', 'integer');
        expect(param).to.have.property('format', 'int32');
        expect(param).to.have.property('required', false);

        done();
      });
    });
    it('param count is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.count;
        expect(param).to.have.property('name', 'count');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Set to true to return count instead of documents. [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#count)'
        );
        expect(param).to.have.property('type', 'boolean');
        expect(param).to.have.property('required', false);

        done();
      });
    });
    it('param conditions is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.conditions;
        expect(param).to.have.property('name', 'conditions');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Set the conditions used to find or remove the document(s). [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#conditions)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });

    it('param sort is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.sort;

        expect(param).to.have.property('name', 'sort');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Set the fields by which to sort. [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#sort)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });

    it('param select is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.select;

        expect(param).to.have.property('name', 'select');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Select which paths will be returned by the query. [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#select)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });

    it('param populate is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.populate;

        expect(param).to.have.property('name', 'populate');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Specify which paths to populate. [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#populate)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });
    it('param distinct is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.distinct;

        expect(param).to.have.property('name', 'distinct');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Set to a path name to retrieve an array of distinct values. [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#distinct)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });

    it('param hint is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.hint;

        expect(param).to.have.property('name', 'hint');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Add an index hint to the query (must be enabled per controller). [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#hint)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });

    it('param comment is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.comment;

        expect(param).to.have.property('name', 'comment');
        expect(param).to.have.property('in', 'query');
        expect(param).to.have.property(
          'description',
          'Add a comment to a query (must be enabled per controller). [doc](https://github.com/wprl/baucis/wiki/Query-String-Parameters#comment)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });

    it('param id is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters.id;

        expect(param).to.have.property('name', 'id');
        expect(param).to.have.property('in', 'path');
        expect(param).to.have.property('description', 'The identifier of the resource.');
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', true);

        done();
      });
    });

    it('param X-Baucis-Update-Operator is generated on put operation', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = body.parameters['X-Baucis-Update-Operator'];
        expect(param).to.have.property('name', 'X-Baucis-Update-Operator');
        expect(param).to.have.property('in', 'header');
        expect(param).to.have.property(
          'description',
          '**BYPASSES VALIDATION** May be used with PUT to update the document using $push, $pull, or $set. [doc](https://github.com/wprl/baucis/wiki/HTTP-Headers)'
        );
        expect(param).to.have.property('type', 'string');
        expect(param).to.have.property('required', false);

        done();
      });
    });
  });

  describe('parameters usage', function(done) {
    it('param skip is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(body.paths['/vegetables'].get.parameters).to.be.an(Array);
        const param = getItemFromArray(
          body.paths['/vegetables'].get.parameters,
          '$ref',
          '#/parameters/skip'
        );
        expect(param).to.have.property('$ref', '#/parameters/skip');

        done();
      });
    });
    it('param limit is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].get.parameters,
          '$ref',
          '#/parameters/limit'
        );
        expect(param).to.have.property('$ref', '#/parameters/limit');

        done();
      });
    });
    it('param count is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].get.parameters,
          '$ref',
          '#/parameters/count'
        );
        expect(param).to.have.property('$ref', '#/parameters/count');

        done();
      });
    });
    it('param conditions is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].get.parameters,
          '$ref',
          '#/parameters/conditions'
        );
        expect(param).to.have.property('$ref', '#/parameters/conditions');

        done();
      });
    });
    it('param sort is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].parameters,
          '$ref',
          '#/parameters/sort'
        );
        expect(param).to.have.property('$ref', '#/parameters/sort');

        done();
      });
    });
    it('param select is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].parameters,
          '$ref',
          '#/parameters/select'
        );
        expect(param).to.have.property('$ref', '#/parameters/select');

        done();
      });
    });
    it('param populate is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].parameters,
          '$ref',
          '#/parameters/populate'
        );
        expect(param).to.have.property('$ref', '#/parameters/populate');

        done();
      });
    });
    it('param distinct is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].get.parameters,
          '$ref',
          '#/parameters/distinct'
        );
        expect(param).to.have.property('$ref', '#/parameters/distinct');

        done();
      });
    });
    it('param hint is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].get.parameters,
          '$ref',
          '#/parameters/hint'
        );
        expect(param).to.have.property('$ref', '#/parameters/hint');

        done();
      });
    });
    it('param comment is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables'].get.parameters,
          '$ref',
          '#/parameters/comment'
        );
        expect(param).to.have.property('$ref', '#/parameters/comment');

        done();
      });
    });

    it('param id is referenced', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        const param = getItemFromArray(
          body.paths['/vegetables/{id}'].parameters,
          '$ref',
          '#/parameters/id'
        );
        expect(param).to.have.property('$ref', '#/parameters/id');

        done();
      });
    });

    it('param document is generated', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.paths['/vegetables/{id}'].put.parameters).to.be.an(Array);
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

        done();
      });
    });
  });

  describe('tags', function() {
    it('tags are declared', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.tags).to.be.an(Array);
        expect(body.tags[0]).to.have.property('name', 'vegetable');
        expect(body.tags[0]).to.have.property('x-resource', true);
        expect(body.tags[1]).to.have.property('name', 'fungus');
        expect(body.tags[1]).to.have.property('x-resource', true);
        expect(body.tags[2]).to.have.property('name', 'goose');
        expect(body.tags[2]).to.have.property('x-resource', true);

        done();
      });
    });

    it('tags labels operations operations', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.paths['/vegetables'].get.tags).to.be.an(Array);
        expect(body.paths['/vegetables'].get.tags[0]).to.be('vegetable'); // resource

        done();
      });
    });
  });

  describe('arrays', function() {
    it('recognizes Mongo array type', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.definitions).to.have.property('Goose');
        expect(body.definitions).to.have.property('GooseStuffed');
        expect(body.definitions.Goose.properties).to.have.property('stuffed');
        expect(body.definitions.Goose.properties.stuffed.type).to.be('array');
        expect(body.definitions.Goose.properties.stuffed.items).to.have.property('$ref');
        expect(body.definitions.Goose.properties.stuffed.items.$ref).to.be(
          '#/definitions/GooseStuffed'
        );

        done();
      });
    });

    it('recognizes array of literals - string', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(body.definitions.ChargeArea.properties).to.have.property('tags');
        expect(body.definitions.ChargeArea.properties.tags.type).to.be('array');
        expect(body.definitions.ChargeArea.properties.tags.items).to.have.property('type');
        expect(body.definitions.ChargeArea.properties.tags.items.type).to.be('string');

        done();
      });
    });

    it('recognizes array of literals - number', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(body.definitions.ChargeArea.properties).to.have.property('orders');
        expect(body.definitions.ChargeArea.properties.orders.type).to.be('array');
        expect(body.definitions.ChargeArea.properties.orders.items).to.have.property('type');
        expect(body.definitions.ChargeArea.properties.orders.items.type).to.be('number');

        done();
      });
    });

    it('recognizes array of ObjectId exposing IDs as string', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        // credits to https://github.com/mdhooge for providing the repro-sample
        expect(body.definitions).to.have.property('ChargeArea');
        expect(body.definitions).to.have.property('ChargeCluster');

        expect(body.definitions.ChargeArea.properties).to.have.property('clusters');
        expect(body.definitions.ChargeArea.properties.clusters.type).to.be('array');
        expect(body.definitions.ChargeArea.properties.clusters).to.have.property('items');
        expect(body.definitions.ChargeArea.properties.clusters.items).to.have.property('type');
        expect(body.definitions.ChargeArea.properties.clusters.items.type).to.be('string'); // ids refs -> string

        done();
      });
    });
  });

  describe('misc', function() {
    it('adds virtuals as model properties', function(done) {
      const options = {
        url: 'http://127.0.0.1:8012/api/swagger.json',
        json: true
      };
      request.get(options, function(err, response, body) {
        if (err) return done(err);

        expect(response).to.have.property('statusCode', 200);

        expect(body.definitions.Vegetable).to.be.an(Object);
        expect(body.definitions.Vegetable.properties).to.have.property('id');
        expect(body.definitions.Vegetable.properties.id.type).to.be('string');

        done();
      });
    });
  });

  describe('pending - todo', function() {
    it('enum values');
    it('securityDefinitions is generated - via customization');
    it('security is generated - via customization');
    it('does not crash when a Mixed type is used');
  });
});
