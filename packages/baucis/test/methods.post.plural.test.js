const {expect} = require('chai');
const request = require('request-promise');
const mongoose = require('mongoose');

const fixtures = require('./fixtures');

describe('POST plural', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should create a new object and return its ID', async function() {
    const {statusCode, body, headers} = await request({
      url: 'http://localhost:8012/api/vegetables/',
      json: {name: 'Tomato'},
      method: 'POST',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(201);
    expect(body._id).not.to.be.empty;
    expect(headers.location).to.equal(`/api/vegetables/${body._id}`);

    const bodyget = await request({
      url: `http://localhost:8012${headers.location}`,
      json: true
    });
    // FIXME BROKEN TEST

    expect(bodyget).to.have.property('name', 'Tomato');
  });

  it('should correctly set location header when there is no trailing slash', async function() {
    const {statusCode, body, headers} = await request({
      method: 'POST',
      url: 'http://localhost:8012/api/vegetables',
      json: {name: 'Tomato'},
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(201);
    expect(body._id).not.to.be.empty;
    expect(headers.location).to.equal(`/api/vegetables/${body._id}`);
  });

  it('should allow posting multiple documents at once', async function() {
    const {body, headers} = await request({
      url: 'http://localhost:8012/api/vegetables/',
      json: [{name: 'Catnip'}, {name: 'Cattail'}],
      method: 'POST',
      resolveWithFullResponse: true
    });
    expect(body[0]._id).not.to.be.empty;
    expect(body[1]._id).not.to.be.empty;

    const bodyget = await request({
      url: `http://localhost:8012${headers.location}`,
      json: true
    });
    expect(bodyget).to.have.property('length', 2);
    expect(bodyget[0]).to.have.property('name', 'Catnip');
    expect(bodyget[1]).to.have.property('name', 'Cattail');
  });

  it('should 422 if no document sent', async function() {
    const {statusCode, body} = await request({
      method: 'POST',
      url: 'http://localhost:8012/api/vegetables/',
      json: [],
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(422);
    expect(body).to.eql([
      {
        message: 'The request body must contain at least one document',
        name: 'RestError'
      }
    ]);
  });

  it('should fire pre save Mongoose middleware', async function() {
    fixtures.vegetable.saveCount = 0;
    await request({
      url: 'http://localhost:8012/api/vegetables/',
      json: {name: 'Ground Cherry'},
      method: 'POST'
    });
    expect(fixtures.vegetable.saveCount).to.equal(1);
  });

  it('should provide correct status and informative body for validation errors', async function() {
    const {statusCode, body} = await request({
      method: 'POST',
      url: 'http://localhost:8012/api/vegetables/',
      json: {score: -1},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(422);
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
  });

  it('should handle malformed JSON inside first-level objects but ignore those outside', async function() {
    const {statusCode, body} = await request({
      method: 'POST',
      url: 'http://localhost:8012/api/vegetables/',
      json: true,
      body: 'bababa { cacacaca "name": "Garlic Scape" }',
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(400);
    expect(body).to.have.property(
      'message',
      'The body of this request was invalid and could not be parsed. "Unexpected token c in JSON at position 2" (400).'
    );
  });
});
