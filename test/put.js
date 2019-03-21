const expect = require('expect.js');
const request = require('request');

const fixtures = require('./fixtures');

describe('PUT singular', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should replace the addressed object if it exists', function(done) {
    const radicchio = vegetables[7];
    const options = {
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('name', 'Radicchio');

      // put the leek on the server
      const options = {
        url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
        json: {
          name: 'Leek'
        }
      };
      request.put(options, function(err, response, body) {
        if (err) return done(err);
        expect(response.statusCode).to.be(200);
        expect(response.headers).to.not.have.property('location');

        const leekId = radicchio._id;
        const options = {
          url: `http://localhost:8012/api/vegetables/${leekId}`,
          json: true
        };
        request.get(options, function(err, response, body) {
          if (err) return done(err);
          expect(response.statusCode).to.be(200);
          expect(body).to.have.property('name', 'Leek');
          done();
        });
      });
    });
  });

  it('should 422 on no document', function(done) {
    const radicchio = vegetables[7];
    const options = {
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('name', 'Radicchio');

      // put the leek on the server
      const options = {
        url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
        json: true
      };
      request.put(options, function(err, response, body) {
        if (err) return done(err);
        expect(response.statusCode).to.be(422);
        expect(body).to.eql([
          {
            message: 'The request body did not contain an update document',
            name: 'RestError'
          }
        ]);
        done();
      });
    });
  });

  it('should 422 on multiple documents', function(done) {
    const radicchio = vegetables[7];
    const options = {
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('name', 'Radicchio');

      // Put some veggies on the server.
      const options = {
        url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
        json: [{name: 'Pea Shoot'}, {name: 'Bitter Melon'}]
      };
      request.put(options, function(err, response, body) {
        if (err) return done(err);
        expect(response.statusCode).to.be(422);
        expect(body).to.eql([
          {
            message: 'The request body contained more than one update document',
            name: 'RestError'
          }
        ]);
        done();
      });
    });
  });

  it('should only allow updates', function(done) {
    const id = 'badbadbadbadbadbadbadbad';
    const options = {
      url: `http://localhost:8012/api/vegetables/${id}`,
      json: true
    };
    // First check it's not there
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(404);
      expect(body).to.have.property('message', 'Nothing matched the requested query (404).');

      // Attempt to update non-existant doc
      const options = {
        url: `http://localhost:8012/api/vegetables/${id}`,
        json: {name: 'Cucumber'}
      };
      request.put(options, function(err, response, body) {
        if (err) return done(err);
        expect(response.statusCode).to.be(404);
        expect(body).to.have.property('message', 'Nothing matched the requested query (404).');

        // Make sure it wasn't created
        const options = {
          url: `http://localhost:8012/api/vegetables/${id}`,
          json: true
        };
        request.get(options, function(err, response, body) {
          if (err) return done(err);
          expect(response.statusCode).to.be(404);
          expect(body).to.have.property('message', 'Nothing matched the requested query (404).');
          done();
        });
      });
    });
  });

  it('should fire pre save Mongoose middleware', function(done) {
    fixtures.vegetable.saveCount = 0;

    const radicchio = vegetables[7];
    const options = {
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: {name: 'Radicchio di Treviso'}
    };
    request.put(options, function(error, response, body) {
      if (error) return done(error);

      expect(fixtures.vegetable.saveCount).to.be(1);
      done();
    });
  });

  it('should allow running validation with methods that currently bypass validation ... maybe');
  it('should always select the version key when locking is enabled ... maybe');
});
