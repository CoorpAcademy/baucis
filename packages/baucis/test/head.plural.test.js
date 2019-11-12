const {expect} = require('chai');
const request = require('request-promise');

const fixtures = require('./fixtures');

describe('HEAD plural', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should get the header', async function() {
    const {statusCode, body} = await request({
      url: 'http://localhost:8012/api/vegetables',
      method: 'HEAD',
      json: true,
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    expect(body).to.equal(undefined);
  });
});
