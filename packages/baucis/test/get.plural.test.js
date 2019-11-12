const {expect} = require('chai');
const request = require('request');

const fixtures = require('./fixtures');

describe('GET plural', function() {
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

  it("should return 'em all", async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables',
      json: true
    });
    expect(body.length).to.equal(vegetables.length, 'some vegetable seems to be missing');
    body.forEach(function(doc) {
      expect(vegetables.some(vege => vege._id.toString() === doc._id)).to.be.true;
    });
  });

  it('should return an array even for one document match', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?limit=1',
      json: true
    });
    expect(body.length).to.equal(1, 'limit wasnt applied');

    body.forEach(function(doc) {
      expect(vegetables.some(vege => vege._id.toString() === doc._id)).to.be.true;
    });
  });

  it('should send 200 when emptyCollection set to 200 and no documents found', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/empty-array',
      json: true
    });
    expect(body.length).to.equal(0);
    expect(body).to.eql([]);
  });

  it('should send 204 when emptyCollection set to 204 and no documents found', async function() {
    const {body, statusCode} = await request({
      url: 'http://localhost:8012/api/no-content',
      json: true,
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(204);
    expect(body).to.equal(undefined);
  });

  it('should send 404 when emptyCollection set to 404 and no documents found', async function() {
    const {body, statusCode} = await request({
      url: 'http://localhost:8012/api/not-found',
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });

    expect(statusCode).to.equal(404);
    expect(body).to.have.property('message', 'Nothing matched the requested query (404).');
  });

  it('should not set Location header', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).not.to.have.property('location');
  });

  it('should use JSON content type', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).to.have.property('content-type');
    expect(response.headers['content-type']).to.contain('application/json');
  });
});
