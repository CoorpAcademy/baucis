const {expect} = require('chai');
const request = require('request');
const baucis = require('..')();

const fixtures = require('./fixtures');

describe('Versioning', function() {
  before(fixtures.versioning.init);
  beforeEach(baucis.empty.bind(baucis));
  after(fixtures.versioning.deinit);

  it('should use the highest release if no request version is specified', function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/parties',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.headers).to.have.property('api-version', '3.0.1');
      done();
    });
  });

  it('should cause an error when an invalid release is specified', function(done) {
    const fn = function() {
      baucis()
        .releases('1.0.0')
        .releases('abc');
    };
    expect(fn).to.throw(/^Release version "abc" is not a valid semver version [(]500[)][.]$/);
    done();
  });

  it('should use the highest valid release in the requested version range', function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/parties',
      json: true,
      headers: {'API-Version': '<3'}
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.headers).to.have.property('api-version', '2.1.0');
      done();
    });
  });

  it('should use the requested release if specific version is given', function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/parties',
      json: true,
      headers: {'API-Version': '1.0.0'}
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.headers).to.have.property('api-version', '1.0.0');
      done();
    });
  });

  it("should 400 if the requested release range can't be satisfied", function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/parties',
      json: true,
      headers: {'API-Version': '>3.0.1'}
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(400);
      expect(response.headers['content-type']).to.contain('text/html'); // I would expect JSON instead of html as negociated with json: true in the caller
      // now is HTML / before was plain/text
      expect(body).to.contain(
        'Bad Request: The requested API version range &quot;&gt;3.0.1&quot; could not be satisfied (400).'
      );
      expect(response.headers).not.to.have.property('api-version');
      done();
    });
  });

  it(
    'should catch controllers that are added twice to overlapping API dependencies'
  ); /* , function (done) {
    baucis.rest('party').versions('>0.0.0');
    baucis.rest('party').versions('<2');
    expect(baucis.bind(baucis)).to.throw(/^Controllers with path "\/parties" exist more than once in a release that overlaps "<2" [(]500[)][.]$/);
    done();
  });*/

  it(
    'should catch controllers that are added twice to the same release'
  ); /* , function (done) {
    baucis.rest('party').versions('0.0.1');
    baucis.rest('party').versions('0.0.1');
    expect(baucis.bind(baucis)).to.throw(/^Controllers with path "\/parties" exist more than once in a release that overlaps "0.0.1" [(]500[)][.]$/);
    done();
  });*/

  it('should catch controllers with invalid version range', function(done) {
    const fn = function() {
      baucis.rest('party').versions('abc');
    };
    expect(fn).to.throw(
      /^Controller version range "abc" was not a valid semver range [(]500[)][.]$/
    );
    done();
  });

  it(
    'should cause an error when a release has no controllers'
  ); /* , function (done) {
    baucis.rest('party').versions('1.5.7');
    var fn = baucis.bind(baucis, { releases: [ '0.0.1', '1.5.7' ]});
    expect(fn).to.throw(/^There are no controllers in release "0[.]0[.]1" [(]500[)][.]$/);
    done();
  });*/

  it(
    "should catch controllers where the API version range doesn't satisfy any releases"
  ); /* , function (done) {
    baucis.rest('party').versions('0.0.1');
    baucis.rest('party').versions('1.4.6');
    expect(baucis.bind(baucis)).to.throw(/^The controller version range "1[.]4[.]6" doesn't satisfy any API release [(]500[)][.]$/);
    done();
  });*/

  it('should work seamlessly when no versioning info is supplied', function(done) {
    const options = {
      url: 'http://localhost:8012/api/unversioned/dungeons',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.headers).to.have.property('api-version', '0.0.1');
      done();
    });
  });

  it('should set the `Vary` header', function(done) {
    const options = {
      url: 'http://localhost:8012/api/unversioned/dungeons',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.headers).to.have.property('vary', 'API-Version, Accept');
      done();
    });
  });

  it('should send "409 Conflict" if there is a version conflict', function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/pumpkins',
      json: true,
      body: {title: 'Franklin'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(201);

      const options = {
        url: `http://localhost:8012/api/versioned/pumpkins/${body._id}`,
        json: true,
        body: {title: 'Ranken', __v: 0}
      };

      request.put(options, function(error, response, body) {
        if (error) return done(error);

        expect(response.statusCode).to.equal(200);

        request.put(options, function(error, response, body) {
          if (error) return done(error);
          expect(response.statusCode).to.equal(409);
          expect(body).to.have.property(
            'message',
            'The requested update would conflict with a previous update (409).'
          );
          done();
        });
      });
    });
  });

  it('should send "409 Conflict" if there is a version conflict (greater than)', function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/pumpkins?sort=-_id',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).not.to.equal(undefined);
      expect(body).to.be.an('array');
      expect(body.length).to.be.above(0);

      const options = {
        url: `http://localhost:8012/api/versioned/pumpkins/${body[0]._id}`,
        json: true,
        body: {__v: body[0].__v + 10}
      };
      request.put(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(409);
        expect(body).to.have.property(
          'message',
          'The requested update would conflict with a previous update (409).'
        );
        done();
      });
    });
  });

  it('should not send "409 Conflict" if there is no version conflict (equal)', function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/pumpkins?sort=-_id',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);

      const options = {
        url: `http://localhost:8012/api/versioned/pumpkins/${body[0]._id}`,
        json: true,
        body: {__v: body[0].__v}
      };
      request.put(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  it('should cause an error if locking is enabled and no version is selected on the doc', function(done) {
    const options = {
      url: 'http://localhost:8012/api/versioned/pumpkins',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);

      const options = {
        url: `http://localhost:8012/api/versioned/pumpkins/${body[0]._id}`,
        json: true,
        body: {title: 'Forest Expansion'}
      };
      request.put(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(422);
        expect(body).to.eql([
          {
            message:
              'Locking is enabled, but the target version was not provided in the request body.',
            name: 'RestError',
            path: '__v'
          }
        ]);
        done();
      });
    });
  });
});
