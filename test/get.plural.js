const {expect} = require('chai');
const request = require('request');

const fixtures = require('./fixtures');

describe('GET plural', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it("should return 'em all", function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(200);
      body.forEach(function(doc, i) {
        const found = vegetables.some(function(vege) {
          return vege._id.toString() === doc._id;
        });
        expect(found).to.equal(true);
      });
      done();
    });
  });

  it('should return an array even for one document match', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?limit=1',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(200);
      body.forEach(function(doc, i) {
        const found = vegetables.some(function(vege) {
          return vege._id.toString() === doc._id;
        });
        expect(found).to.equal(true);
      });
      done();
    });
  });

  it('should send 200 when emptyCollection set to 200 and no documents found', function(done) {
    const options = {
      url: 'http://localhost:8012/api/empty-array',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(200);
      expect(body).to.eql([]);
      done();
    });
  });

  it('should send 204 when emptyCollection set to 204 and no documents found', function(done) {
    const options = {
      url: 'http://localhost:8012/api/no-content',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(204);
      expect(body).to.equal(undefined);
      done();
    });
  });

  it('should send 404 when emptyCollection set to 404 and no documents found', function(done) {
    const options = {
      url: 'http://localhost:8012/api/not-found',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(404);
      expect(body).to.have.property('message', 'Nothing matched the requested query (404).');
      done();
    });
  });

  it('should not set Location header', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.headers).not.to.have.property('location');
      done();
    });
  });

  it('should use JSON content type', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.headers).to.have.property('content-type');
      expect(response.headers['content-type']).to.contain('application/json');
      done();
    });
  });
});
