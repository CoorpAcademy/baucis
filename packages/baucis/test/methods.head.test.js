const {expect} = require('chai');
const request = require('request-promise');

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

  it('should get the header for the addressed document', async function() {
    const turnip = vegetables[0];
    const {statusCode, body} = await request({
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      method: 'HEAD',
      resolveWithFullResponse: true,
      json: true
    });
    expect(statusCode).to.equal(200);
    expect(body).to.equal(undefined);
  });

  it('should return a 404 when ID not found', async function() {
    const {statusCode, body} = await request({
      url: 'http://localhost:8012/api/vegetables/666666666666666666666666',
      method: 'HEAD',
      resolveWithFullResponse: true,
      json: true,
      simple: false
    });
    expect(statusCode).to.equal(404);
    expect(body).to.equal(undefined);
  });
});
