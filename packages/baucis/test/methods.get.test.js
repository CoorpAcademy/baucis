const {expect} = require('chai');
const request = require('request-promise');

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

  it('should get the addressed document', async function() {
    const turnip = vegetables[0];
    const body = await request({
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      json: true
    });
    expect(body).to.have.property('_id', turnip._id.toString());
    expect(body).to.have.property('name', 'Turnip');
  });

  it('should return a 404 when ID not found', async function() {
    const {statusCode, body} = await request({
      url: 'http://localhost:8012/api/vegetables/666666666666666666666666',
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(404);
    expect(body).to.have.property('message', 'Nothing matched the requested query (404).');
  });

  it('should not set Location header', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables/6',
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });
    expect(response.headers).not.to.have.property('location');
  });
});
