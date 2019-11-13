const {expect} = require('chai');
const request = require('request-promise');
const fixtures = require('./fixtures');
const baucis = require('..')();

describe('Versioning', function() {
  before(fixtures.versioning.init);
  beforeEach(baucis.empty.bind(baucis));
  after(fixtures.versioning.deinit);

  it('should use the highest release if no request version is specified', async function() {
    const {headers} = await request({
      url: 'http://localhost:8012/api/versioned/parties',
      json: true,
      resolveWithFullResponse: true
    });
    expect(headers).to.have.property('api-version', '3.0.1');
  });

  it('should cause an error when an invalid release is specified', function() {
    const fn = function() {
      baucis()
        .releases('1.0.0')
        .releases('abc');
    };
    expect(fn).to.throw(/^Release version "abc" is not a valid semver version [(]500[)][.]$/);
  });

  it('should use the highest valid release in the requested version range', async function() {
    const {headers} = await request({
      url: 'http://localhost:8012/api/versioned/parties',
      json: true,
      headers: {'API-Version': '<3'},
      resolveWithFullResponse: true
    });
    expect(headers).to.have.property('api-version', '2.1.0');
  });

  it('should use the requested release if specific version is given', async function() {
    const {headers} = await request({
      url: 'http://localhost:8012/api/versioned/parties',
      json: true,
      headers: {'API-Version': '1.0.0'},
      resolveWithFullResponse: true
    });
    expect(headers).to.have.property('api-version', '1.0.0');
  });

  it("should 400 if the requested release range can't be satisfied", async function() {
    const {statusCode, headers, body} = await request({
      url: 'http://localhost:8012/api/versioned/parties',
      json: true,
      headers: {'API-Version': '>3.0.1'},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(400);
    expect(headers['content-type']).to.contain('text/html'); // I would expect JSON instead of html as negociated with json: true in the caller
    // now is HTML / before was plain/text
    expect(body).to.contain(
      'Bad Request: The requested API version range &quot;&gt;3.0.1&quot; could not be satisfied (400).'
    );
    expect(headers).not.to.have.property('api-version');
  });

  it(
    'should catch controllers that are added twice to overlapping API dependencies'
  ); /* , function (done) {
    baucis.rest('party').versions('>0.0.0');
    baucis.rest('party').versions('<2');
    expect(baucis.bind(baucis)).to.throw(/^Controllers with path "\/parties" exist more than once in a release that overlaps "<2" [(]500[)][.]$/);
    done();
  });*/

  it(
    'should catch controllers that are added twice to the same release'
  ); /* , function (done) {
    baucis.rest('party').versions('0.0.1');
    baucis.rest('party').versions('0.0.1');
    expect(baucis.bind(baucis)).to.throw(/^Controllers with path "\/parties" exist more than once in a release that overlaps "0.0.1" [(]500[)][.]$/);
    done();
  });*/

  it('should catch controllers with invalid version range', function() {
    const fn = function() {
      baucis.rest('party').versions('abc');
    };
    expect(fn).to.throw(
      /^Controller version range "abc" was not a valid semver range [(]500[)][.]$/
    );
  });

  it(
    'should cause an error when a release has no controllers'
  ); /* , function (done) {
    baucis.rest('party').versions('1.5.7');
    var fn = baucis.bind(baucis, { releases: [ '0.0.1', '1.5.7' ]});
    expect(fn).to.throw(/^There are no controllers in release "0[.]0[.]1" [(]500[)][.]$/);
    done();
  });*/

  it(
    "should catch controllers where the API version range doesn't satisfy any releases"
  ); /* , function (done) {
    baucis.rest('party').versions('0.0.1');
    baucis.rest('party').versions('1.4.6');
    expect(baucis.bind(baucis)).to.throw(/^The controller version range "1[.]4[.]6" doesn't satisfy any API release [(]500[)][.]$/);
    done();
  });*/

  it('should work seamlessly when no versioning info is supplied', async function() {
    const {headers} = await request({
      url: 'http://localhost:8012/api/unversioned/dungeons',
      json: true,
      resolveWithFullResponse: true
    });
    expect(headers).to.have.property('api-version', '0.0.1');
  });

  it('should set the `Vary` header', async function() {
    const {headers} = await request({
      url: 'http://localhost:8012/api/unversioned/dungeons',
      json: true,
      resolveWithFullResponse: true
    });
    expect(headers).to.have.property('vary', 'API-Version, Accept');
  });

  it('should send "409 Conflict" if there is a version conflict', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/versioned/pumpkins',
      json: true,
      body: {title: 'Franklin'},
      method: 'POST'
    });
    await request({
      url: `http://localhost:8012/api/versioned/pumpkins/${body._id}`,
      json: true,
      body: {title: 'Ranken', __v: 0},
      method: 'PUT'
    });
    const response = await request({
      url: `http://localhost:8012/api/versioned/pumpkins/${body._id}`,
      json: true,
      body: {title: 'Ranken', __v: 0},
      method: 'PUT',
      resolveWithFullResponse: true,
      simple: false
    });

    expect(response.statusCode).to.equal(409);
    expect(response.body).to.have.property(
      'message',
      'The requested update would conflict with a previous update (409).'
    );
  });

  it('should send "409 Conflict" if there is a version conflict (greater than)', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/versioned/pumpkins?sort=-_id',
      json: true
    });
    expect(body).not.to.equal(undefined);
    expect(body).to.be.an('array');
    expect(body.length).to.be.above(0);

    const response = await request({
      url: `http://localhost:8012/api/versioned/pumpkins/${body[0]._id}`,
      json: true,
      body: {__v: body[0].__v + 10},
      method: 'PUT',
      resolveWithFullResponse: true,
      simple: false
    });
    expect(response.statusCode).to.equal(409);
    expect(response.body).to.have.property(
      'message',
      'The requested update would conflict with a previous update (409).'
    );
  });

  it('should not send "409 Conflict" if there is no version conflict (equal)', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/versioned/pumpkins?sort=-_id',
      json: true
    }); // ensure 200
    await request({
      url: `http://localhost:8012/api/versioned/pumpkins/${body[0]._id}`,
      json: true,
      body: {__v: body[0].__v},
      method: 'PUT'
    });
  });

  it('should cause an error if locking is enabled and no version is selected on the doc', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/versioned/pumpkins',
      json: true
    });
    const response = await request({
      url: `http://localhost:8012/api/versioned/pumpkins/${body[0]._id}`,
      json: true,
      body: {title: 'Forest Expansion'},
      method: 'PUT',
      resolveWithFullResponse: true,
      simple: false
    });
    expect(response.statusCode).to.equal(422);
    expect(response.body).to.eql([
      {
        message: 'Locking is enabled, but the target version was not provided in the request body.',
        name: 'RestError',
        path: '__v'
      }
    ]);
  });
});
