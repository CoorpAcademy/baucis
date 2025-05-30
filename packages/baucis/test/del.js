const {expect} = require('chai');
const request = require('request');

const fixtures = require('./fixtures');

describe('DELETE singular', function() {
  let vegetables;
  before(fixtures.vegetable.init);
  beforeEach(async () => {
    vegetables = await fixtures.vegetable.create();
  });
  after(fixtures.vegetable.deinit);

  it('should delete the addressed document', function(done) {
    const shitake = vegetables[3];
    const options = {
      url: `http://localhost:8012/api/vegetables/${shitake._id}`,
      json: true
    };
    request.del(options, function(error, response, body) {
      if (error) return done(error);

      const options = {
        url: `http://localhost:8012/api/vegetables/${shitake._id}`,
        json: true
      };

      expect(response.statusCode).to.equal(200);
      expect(body).to.equal(1); // count of deleted objects

      request.del(options, function(error, response, body) {
        if (error) return done(error);

        expect(response.statusCode).to.equal(404);
        expect(body).to.have.property('message', 'Nothing matched the requested query (404).');
        done();
      });
    });
  });

  it('should invoke "remove" middleware', function(done) {
    const shitake = vegetables[3];
    const options = {
      url: `http://localhost:8012/api/vegetables/${shitake._id}`,
      json: true
    };

    fixtures.vegetable.removeCount = 0;
    request.del(options, function(error, response, body) {
      if (error) return done(error);
      expect(fixtures.vegetable).to.have.property('removeCount', 1);
      done();
    });
  });
});
