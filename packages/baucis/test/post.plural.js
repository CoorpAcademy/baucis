const {expect} = require('chai');
const request = require('request');
const mongoose = require('mongoose');

const fixtures = require('./fixtures');

describe('POST plural', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should create a new object and return its ID', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: {name: 'Tomato'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(201);
      expect(body._id).not.to.be.empty;
      expect(response.headers.location).to.equal(`/api/vegetables/${body._id}`);

      const options = {
        url: `http://localhost:8012${response.headers.location}`,
        json: true
      };
      request.get(options, function(error, response, body) {
        if (error) return done(error);
        // FIXME BROKEN TEST
        expect(response.statusCode).to.equal(200);
        expect(body).to.have.property('name', 'Tomato');
        done();
      });
    });
  });

  it('should correctly set location header when there is no trailing slash', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      json: {name: 'Tomato'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(201);
      expect(body._id).not.to.be.empty;
      expect(response.headers.location).to.equal(`/api/vegetables/${body._id}`);

      done();
    });
  });

  it('should allow posting multiple documents at once', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: [{name: 'Catnip'}, {name: 'Cattail'}]
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(201);
      expect(body[0]._id).not.to.be.empty;
      expect(body[1]._id).not.to.be.empty;

      const options = {
        url: `http://localhost:8012${response.headers.location}`,
        json: true
      };
      request.get(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(200);
        expect(body).to.have.property('length', 2);
        expect(body[0]).to.have.property('name', 'Catnip');
        expect(body[1]).to.have.property('name', 'Cattail');
        done();
      });
    });
  });

  it('should 422 if no document sent', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: []
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(422);
      expect(body).to.eql([
        {
          message: 'The request body must contain at least one document',
          name: 'RestError'
        }
      ]);
      done();
    });
  });

  it('should fire pre save Mongoose middleware', function(done) {
    fixtures.vegetable.saveCount = 0;

    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: {name: 'Ground Cherry'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);

      expect(fixtures.vegetable.saveCount).to.equal(1);
      done();
    });
  });

  it('should provide correct status and informative body for validation errors', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: {score: -1}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(422);
      expect(body).to.have.property('length', 2);
      expect(body[0]).to.have.property('message', 'Path `name` is required.');
      expect(body[0]).to.have.property('name', 'ValidatorError');
      expect(body[0]).to.have.property('path', 'name');

      if (mongoose.version[0] === '3') {
        expect(body[0]).to.have.property('type', 'required');
      } else {
        expect(body[0]).to.have.property('kind', 'required');
      }

      expect(body[1]).to.have.property(
        'message',
        'Path `score` (-1) is less than minimum allowed value (1).'
      );
      expect(body[1]).to.have.property('name', 'ValidatorError');
      expect(body[1]).to.have.property('path', 'score');

      if (mongoose.version[0] === '3') {
        expect(body[1]).to.have.property('type', 'min');
      } else {
        expect(body[1]).to.have.property('kind', 'min');
      }

      expect(body[1]).to.have.property('value', -1);

      done();
    });
  });

  it('should handle malformed JSON inside first-level objects but ignore those outside', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: true,
      body: 'bababa { cacacaca "name": "Garlic Scape" }'
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(
        /The body of this request was invalid and could not be parsed. "(Unexpected token c in JSON at position 2|Expected property name or '}' in JSON at position 2( \(line 1 column 3\))?)" \(400\)./.test(
          body.message
        )
      ).to.be.equal(true, 'Message was not the one expected');

      done();
    });
  });
});
