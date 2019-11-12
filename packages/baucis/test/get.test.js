const {expect} = require('chai');
const request = require('request');

const fixtures = require('./fixtures');

describe('GET singular', function() {
  let vegetables;
  before(fixtures.vegetable.init);
  beforeEach(done =>
    fixtures.vegetable.create((err, legumes) => {
      if (err) return done(err);
      vegetables = legumes;
      return done();
    })
  );
  after(fixtures.vegetable.deinit);

  it('should get the addressed document', function(done) {
    const turnip = vegetables[0];
    const options = {
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('_id', turnip._id.toString());
      expect(body).to.have.property('name', 'Turnip');
      done();
    });
  });

  it('should return a 404 when ID not found', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/666666666666666666666666',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(404);
      expect(body).to.have.property('message', 'Nothing matched the requested query (404).');
      done();
    });
  });

  it('should not set Location header', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/6',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.headers).not.to.have.property('location');
      done();
    });
  });
});
