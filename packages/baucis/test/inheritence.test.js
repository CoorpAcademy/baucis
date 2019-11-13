// __Dependencies__
const {expect} = require('chai');
const request = require('request-promise');

const fixtures = require('./fixtures');

describe('Inheritence', function() {
  // __Test Hooks__
  before(fixtures.inheritence.init);
  beforeEach(fixtures.inheritence.create);
  after(fixtures.inheritence.deinit);

  it('should return all documents for parent model controller', async function() {
    const {body, statusCode} = await request({
      url: 'http://localhost:8012/api/liqueurs',
      resolveWithFullResponse: true,
      json: true
    });
    expect(statusCode).to.equal(200);
    expect(body).to.have.property('length', 6);
  });

  // There seems to be an bug in mongoose that prevents this from working...
  it(
    'should return typed documents for child model controller'
  ); /* , function (done) {
    var options = {
      url: 'http://localhost:8012/api/amari',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 3);
      done();
    });
  });*/

  // __Tests__
  it('should create parent model when no discriminator is supplied', async function() {
    const {statusCode, body, headers} = await request({
      url: 'http://localhost:8012/api/liqueurs',
      json: {name: 'Generic 2'},
      method: 'POST',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(201);
    expect(body).not.to.have.property('__t');

    const response = await request({
      url: `http://localhost:8012${headers.location}`,
      resolveWithFullResponse: true,
      json: true
    });
    expect(response.statusCode).to.equal(200);
    expect(response.body).to.have.property('name', 'Generic 2');
  });

  it('should create child model when a discriminator is supplied', async function() {
    const {statusCode, body, headers} = await request({
      url: 'http://localhost:8012/api/liqueurs',
      json: {name: 'Elderberry', sweetness: 3, __t: 'cordial'},
      resolveWithFullResponse: true,
      method: 'POST'
    });
    expect(statusCode).to.equal(201);
    expect(body).to.have.property('__t', 'cordial');

    const response = await request({
      url: `http://localhost:8012${headers.location}`,
      resolveWithFullResponse: true,
      json: true
    });
    expect(response.statusCode).to.equal(200);
    expect(response.body).to.have.property('name', 'Elderberry');
  });

  it('should give a 422 if the discriminator does not exist', async function() {
    const response = await request({
      method: 'POST',
      url: 'http://localhost:8012/api/liqueurs',
      json: {name: 'Oud Bruin', __t: 'ale'},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(response.statusCode).to.equal(422);
    expect(response.body).to.eql([
      {
        message: "A document's type did not match any known discriminators for this resource",
        name: 'RestError',
        path: '__t',
        value: 'ale'
      }
    ]);
  });
});
