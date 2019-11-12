const {expect} = require('chai');
const request = require('request-promise');

const fixtures = require('./fixtures');

describe('DEL plural', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should delete all documents in addressed collection', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables/',
      json: true,
      method: 'DELETE'
    });
    expect(body).to.equal(8);
  });

  it('should invoke "remove" middleware', async function() {
    fixtures.vegetable.removeCount = 0;
    await request({
      url: 'http://localhost:8012/api/vegetables/',
      json: true,
      method: 'DELETE'
    });
    expect(fixtures.vegetable).to.have.property('removeCount', 8);
  });
});
