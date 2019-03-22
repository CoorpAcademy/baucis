const expect = require('expect.js');
const request = require('request');

const fixtures = require('./fixtures');

describe('Swagger Resource Listing', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should generate the correct listing', function(done) {
    const options = {
      url: 'http://127.0.0.1:8012/api/documentation',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);

      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('apiVersion', '0.0.1');
      expect(body).to.have.property('swaggerVersion', '1.1');
      expect(body).to.have.property('basePath', 'http://127.0.0.1:8012/api');
      expect(body).to.have.property('apis');

      // Check the API listing
      expect(body.apis).to.be.an(Array);
      expect(body.apis).to.have.property('length', 3);
      expect(body.apis[0].path).to.be('/documentation/vegetables');
      expect(body.apis[0].description).to.be('Operations about vegetables.');
      expect(body.apis[1].path).to.be('/documentation/fungi');
      expect(body.apis[1].description).to.be('Operations about fungi.');
      expect(body.apis[2].path).to.be('/documentation/geese');
      expect(body.apis[2].description).to.be('Operations about geese.');

      done();
    });
  });

  it('should generate the correct API definition', function(done) {
    const options = {
      url: 'http://127.0.0.1:8012/api/documentation/vegetables',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);

      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('apiVersion', '0.0.1');
      expect(body).to.have.property('swaggerVersion', '1.1');
      expect(body).to.have.property('basePath', 'http://127.0.0.1:8012/api');
      expect(body).to.have.property('resourcePath', '/vegetables');
      expect(body).to.have.property('models');
      expect(body).to.have.property('apis');
      expect(body.apis).to.be.an(Array);

      // Check the model
      expect(body.models).to.have.property('Vegetable');
      expect(body.models.Vegetable).to.have.property('id', 'Vegetable');
      expect(body.models.Vegetable).to.have.property('properties');
      expect(body.models.Vegetable.properties).to.have.property('name');
      expect(body.models.Vegetable.properties.name).to.have.property('type', 'string');
      expect(body.models.Vegetable.properties.name).to.have.property('required', true);
      expect(body.models.Vegetable.properties).to.have.property('_id');
      expect(body.models.Vegetable.properties._id).to.have.property('type', 'string');
      expect(body.models.Vegetable.properties._id).to.have.property('required', false);
      expect(body.models.Vegetable.properties).to.have.property('__v');
      expect(body.models.Vegetable.properties.__v).to.have.property('type', 'double');
      expect(body.models.Vegetable.properties.__v).to.have.property('required', false);
      expect(body.models.Vegetable.properties).not.to.have.property('diseases');

      // Check the API listing
      expect(body.apis[1].path).to.be('/vegetables');
      expect(body.apis[0].path).to.be('/vegetables/{id}');
      expect(body.apis[1].operations).to.be.an(Array);
      expect(body.apis[0].operations).to.be.an(Array);
      expect(body.apis[1].operations).to.have.property('length', 3);
      expect(body.apis[0].operations).to.have.property('length', 3);

      done();
    });
  });

  it("should copy all properties from the controller's swagger object", function(done) {
    const options = {
      url: 'http://127.0.0.1:8012/api/documentation/vegetables',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('lambic', 'kriek');
      done();
    });
  });

  it('should correctly set paths as private even if the path name contains hyphens', function(done) {
    const options = {
      url: 'http://127.0.0.1:8012/api/documentation/fungi',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);

      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('models');
      expect(body.models).to.have.property('Fungus');
      expect(body.models.Fungus.properties).to.not.have.property('hyphenated-field-name');
      expect(body.models.Fungus.properties).to.not.have.property('password');
      expect(body.models.Fungus.properties).to.have.property('dork');
      done();
    });
  });

  it('should allow adding custom APIs', function(done) {
    fixtures.vegetable.controller.swagger.apis.push({
      path: '/vegetables/best',
      description: 'Operations on the best vegetable.',
      operations: [
        {
          httpMethod: 'GET',
          nickname: 'getBestVegetable',
          responseClass: 'Vegetable',
          summary: 'Get the best vegetable'
        }
      ]
    });
    const options = {
      url: 'http://127.0.0.1:8012/api/documentation/vegetables',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);

      expect(response).to.have.property('statusCode', 200);
      expect(body.apis[2]).to.have.property('path', '/vegetables/best');
      done();
    });
  });

  it('should generate models correctly', function(done) {
    const options = {
      url: 'http://127.0.0.1:8012/api/documentation/geese',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);

      expect(response).to.have.property('statusCode', 200);
      expect(body.models).to.have.property('Goose');
      expect(body.models.Goose).to.have.property('id', 'Goose');
      expect(body.models.Goose.properties).to.have.property('cooked');
      expect(body.models.Goose.properties).to.have.property('_id');
      expect(body.models.Goose.properties).to.have.property('__v');

      done();
    });
  });

  it('should generate embedded models correctly');
  it('should keep paths deselected in the schema private');
  it('should keep paths deselected in the controller private');

  it('does not crash when a Mixed type is used');
  it('recognizes Mongo array type');
  it('adds virtuals as model properties');
});
