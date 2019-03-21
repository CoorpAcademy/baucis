const {expect} = require('chai');
const request = require('request');

const fixtures = require('./fixtures');

describe('HEAD singular', function() {
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

  it('should get the header for the addressed document', function(done) {
    const turnip = vegetables[0];
    const options = {
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      json: true
    };
    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.equal(undefined);
      done();
    });
  });

  it('should return a 404 when ID not found', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/666666666666666666666666',
      json: true
    };
    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(404);
      expect(body).to.equal(undefined);
      done();
    });
  });
});
