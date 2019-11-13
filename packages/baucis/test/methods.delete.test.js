const {expect} = require('chai');
const request = require('request-promise');

const fixtures = require('./fixtures');

describe('DELETE singular', function() {
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

  it('should delete the addressed document', async function() {
    const shitake = vegetables[3];
    const body = await request({
      url: `http://localhost:8012/api/vegetables/${shitake._id}`,
      method: 'DELETE',
      json: true
    });
    expect(body).to.equal(1); // count of deleted objects

    const response = await request({
      url: `http://localhost:8012/api/vegetables/${shitake._id}`,
      method: 'DELETE',
      resolveWithFullResponse: true,
      simple: false,
      json: true
    });
    expect(response.statusCode).to.equal(404);
    expect(response.body).to.have.property('message', 'Nothing matched the requested query (404).');
  });

  it('should invoke "remove" middleware', async function() {
    const shitake = vegetables[3];

    fixtures.vegetable.removeCount = 0;
    await request({
      url: `http://localhost:8012/api/vegetables/${shitake._id}`,
      method: 'DELETE',
      json: true
    });
    expect(fixtures.vegetable).to.have.property('removeCount', 1);
  });
});
