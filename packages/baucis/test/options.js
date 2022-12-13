const {expect} = require('chai');
const request = require('request').defaults({json: true});

const fixtures = require('./fixtures');

describe.skip('OPTIONS instance/collection', function() {
  let vegetables;
  before(fixtures.vegetable.init);
  beforeEach(async () => {
    vegetables = await fixtures.vegetable.create();
  });
  after(fixtures.vegetable.deinit);

  it('provides options for the collection', function(done) {
    const url = 'http://localhost:8012/api/vegetables/';

    request({method: 'OPTIONS', url}, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(200);
      expect(body).to.equal('HEAD,GET,POST,PUT,DELETE');

      expect(response.headers).to.have.property('vary', 'API-Version');
      expect(response.headers).to.have.property('api-version', '0.0.1');
      expect(response.headers).to.have.property('allow', 'HEAD,GET,POST,PUT,DELETE');
      expect(response.headers).to.have.property('date');
      expect(response.headers).to.have.property('connection', 'keep-alive');

      done();
    });
  });

  it('provides options for the instance', function(done) {
    const shitake = vegetables[3];
    const url = `http://localhost:8012/api/vegetables/${shitake._id}`;

    request({method: 'OPTIONS', url}, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(200);
      expect(body).to.equal('HEAD,GET,POST,PUT,DELETE');

      expect(response.headers).to.have.property('vary', 'API-Version');
      expect(response.headers).to.have.property('api-version', '0.0.1');
      expect(response.headers).to.have.property('allow', 'HEAD,GET,POST,PUT,DELETE');
      expect(response.headers).to.have.property('date');
      expect(response.headers).to.have.property('connection', 'keep-alive');

      done();
    });
  });
});
