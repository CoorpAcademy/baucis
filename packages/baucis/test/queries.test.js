const {expect} = require('chai');
const request = require('request-promise');
const parselinks = require('parse-links');

const fixtures = require('./fixtures');

describe('Queries', function() {
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

  it('should support skip 1', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?skip=1',
      json: true
    });
    expect(body).to.have.property('length', vegetables.length - 1);
  });

  it('should support skip 2', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?skip=2',
      json: true
    });
    expect(body).to.have.property('length', vegetables.length - 2);
  });

  it('should support limit 1', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/minerals?limit=1',
      json: true
    });
    expect(body).to.have.property('length', 1);
  });

  it('should support limit 2', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true
    });
    expect(body).to.have.property('length', 2);
  });

  it('disallows selecting deselected fields', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?select=species+lastModified',
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });

    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Including excluded fields is not permitted (403).'
    );
  });

  it('disallows populating deselected fields 1', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?populate=species',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Including excluded fields is not permitted (403).'
    );
  });

  it('disallows populating deselected fields 2', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?populate={ "path": "species" }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Including excluded fields is not permitted (403).'
    );
  });

  it('should support default express query parser when using populate', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?populate[path]=species',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Including excluded fields is not permitted (403).'
    );
  });

  it('disallows using +fields with populate', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?populate={ "select": "%2Bboiler" }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Selecting fields of populated documents is not permitted (403).'
    );
  });

  it('disallows using +fields with select', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?select=%2Bboiler',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Including excluded fields is not permitted (403).'
    );
  });

  it('disallows selecting fields when populating', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?populate={ "path": "a", "select": "arbitrary" }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Selecting fields of populated documents is not permitted (403).'
    );
  });

  it('should not crash when disallowing selecting fields when populating', async function() {
    const response = await request({
      url:
        'http://localhost:8012/api/vegetables?populate=[{ "path": "a", "select": "arbitrary actuary" }, { "path": "b", "select": "arbitrary actuary" }]',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Selecting fields of populated documents is not permitted (403).'
    );
  });

  it('disallows selecting fields when populating', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?populate={ "path": "a", "select": "arbitrary" }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Selecting fields of populated documents is not permitted (403).'
    );
  });

  it('allows populating children', async function() {
    const id = vegetables[0]._id;
    const body = await request({
      url: `http://localhost:8012/api/vegetables/${id}/?populate=nutrients`,
      json: true
    });
    expect(body).to.have.property('nutrients');
    expect(body.nutrients).to.have.property('length', 1);
    expect(body.nutrients[0]).to.have.property('color', 'Blue');
  });

  it('allows query by Id', async function() {
    const id = vegetables[0]._id;
    const body = await request({
      url: `http://localhost:8012/api/vegetables/${id}`,
      json: true
    });
    expect(body).to.have.property('name', 'Turnip');
  });

  it('allows default express query string format', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?conditions[name]=Radicchio',
      json: true
    });
    expect(body).to.have.property('length', 1);
    expect(body[0]).to.have.property('name', 'Radicchio');
  });

  it('allows selecting fields', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?select=-_id lastModified',
      json: true
    });
    expect(body[0]).not.to.have.property('_id');
    expect(body[0]).not.to.have.property('name');
    expect(body[0]).to.have.property('lastModified');
  });

  it('allows setting default sort', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/minerals',
      json: true
    });
    let lastMineral = '';
    body.forEach(function(mineral) {
      expect(mineral.color > lastMineral).to.be.true;
      lastMineral = mineral.color;
    });
  });

  it('allows overriding default sort', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/minerals?sort=-color',
      json: true
    });
    let lastMineral = '';
    body.forEach(function(mineral) {
      if (lastMineral) expect(mineral.color < lastMineral).to.be.true;
      lastMineral = mineral.color;
    });
  });

  it('allows deselecting hyphenated field names', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?select=-hyphenated-field-name',
      json: true
    });
    expect(body[0]).to.have.property('_id');
    expect(body[0]).to.have.property('__v');
    expect(body[0]).not.to.have.property('hpyhenated-field-name');
  });

  it('should not add query string to the search link (collection)', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?sort=color',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers.link).to.equal(
      '</api/minerals>; rel="search", </api/minerals?sort=color>; rel="self"'
    );
  });

  it('should not add query string to the search link (instance)', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/minerals',
      json: true
    });
    const id = body[0]._id;
    const {statusCode, headers} = await request({
      url: `http://localhost:8012/api/minerals/${id}?sort=color`,
      json: true,
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    expect(headers.link).to.equal(
      `${'</api/minerals>; rel="collection", </api/minerals>; rel="search", </api/minerals/'}${id}>; rel="edit", </api/minerals/${id}>; rel="self"`
    );
  });

  it('should send 400 if limit is invalid', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=-1',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.headers).not.to.have.property('link');
    expect(response.body).to.have.property(
      'message',
      'Limit must be a positive integer if set (400).'
    );
  });

  it('should send 400 if limit is invalid', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=0',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.headers).not.to.have.property('link');
    expect(response.body).to.have.property(
      'message',
      'Limit must be a positive integer if set (400).'
    );
  });

  it('should send 400 if limit is invalid', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=3.6',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.headers).not.to.have.property('link');
    expect(response.body).to.have.property(
      'message',
      'Limit must be a positive integer if set (400).'
    );
  });

  it('should send 400 if limit is invalid', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit= asd  asd ',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.headers).not.to.have.property('link');
    expect(response.body).to.have.property(
      'message',
      'Limit must be a positive integer if set (400).'
    );
  });

  it('should send 400 if skip is invalid', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?skip=1.1',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.headers).not.to.have.property('link');
    expect(response.body).to.have.property(
      'message',
      'Skip must be a non-negative integer if set (400).'
    );
  });

  it('should send 400 if count is invalid', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?count=1',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.headers).not.to.have.property('link');
    expect(response.body).to.have.property(
      'message',
      'Count must be "true" or "false" if set (400).'
    );
  });

  it('allows adding paging links', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).to.have.property('link');
  });

  it('should not return paging links if limit not set', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?sort=name',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers.link).to.contain('rel="self"');
    expect(response.headers.link).to.contain('rel="search"');
    expect(response.headers.link).to.not.contain('rel="first"');
    expect(response.headers.link).to.not.contain('rel="last"');
    expect(response.headers.link).to.not.contain('rel="next"');
    expect(response.headers.link).to.not.contain('rel="previous"');
  });

  it('should not return paging links if relations are not enabled', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers.link).to.equal(undefined);
  });

  it('allows using relations: true with sorted queries', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?sort=color&limit=2&skip=2&select=-__v -_id -enables',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers.link).to.contain('rel="first"');
    expect(response.headers.link).to.contain('rel="last"');
    expect(response.headers.link).to.contain('rel="next"');
    expect(response.headers.link).to.contain('rel="previous"');
    expect(response.body).to.eql([{color: 'Indigo'}, {color: 'Orange'}]);
  });

  it('should return next for first page', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).to.have.property('link');
    expect(response.headers.link).to.contain('rel="next"');
  });

  it('should return previous for second page', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2&skip=2',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).to.have.property('link');
    expect(response.headers.link).to.contain('rel="previous"');
  });

  it('should not return paging links previous for first page', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).to.have.property('link');
    expect(response.headers.link).not.to.contain('rel="previous"');
  });

  it('should not return paging links next for last page', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2&skip=6',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).to.have.property('link');
    expect(response.headers.link).not.to.contain('rel="next"');
  });

  it('should preserve query in paging links', async function() {
    const conditions = JSON.stringify({color: {$regex: '.*e.*'}});
    const response = await request({
      url: `http://localhost:8012/api/minerals?limit=1&skip=0&conditions=${conditions}`,
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.headers).to.have.property('link');
    expect(response.headers.link).to.contain('rel="next"');
    const links = parselinks(response.headers.link);
    expect(links.next).to.contain(`conditions=${encodeURIComponent(conditions)}`);
  });

  it('allows retrieving paging links next', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2&skip=0',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(200);
    expect(response.headers).to.have.property('link');

    const links = parselinks(response.headers.link);
    expect(links).to.have.property('next');

    await request({
      url: `http://localhost:8012${links.next}`,
      json: true
    });
  });

  it('allows retrieving paging links previous', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2&skip=2',
      json: true,
      resolveWithFullResponse: true
    });

    expect(response.statusCode).to.equal(200);
    expect(response.headers).to.have.property('link');
    const links = parselinks(response.headers.link);
    expect(links).to.have.property('previous');
    await request({
      url: `http://localhost:8012${links.previous}`,
      json: true
    });
  });

  it('allows retrieving paging links last', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2&skip=6',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(200);
    expect(response.headers).to.have.property('link');
    const links = parselinks(response.headers.link);
    expect(links).to.have.property('first');
    await request({
      url: `http://localhost:8012${links.first}`,
      json: true
    });
  });

  it('allows retrieving paging links first', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/minerals?limit=2&skip=0',
      json: true,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(200);
    expect(response.headers).to.have.property('link');
    const links = parselinks(response.headers.link);
    expect(links).to.have.property('last');
    await request({
      url: `http://localhost:8012${links.last}`,
      json: true
    });
  });

  it('allows retrieving count instead of documents', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?count=true',
      json: true
    });
    expect(body).to.equal(8);
  });

  it('should not send count if count is not set to true', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?count=false',
      json: true
    });
    expect(body).not.to.be.a('number');
  });

  it('should report bad hints', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?hint={ "foogle": 1 }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.body).to.have.property('message', 'The requested query hint is invalid (400).');

    /* FIXME: to kill
    // NOTE: for some reason in node 10 the exception gets uncaught.
    // below is a workarround to have mocha test pass in that situation
    // while verifying the uncaugh error did happen
    const mochaUncaught = process.listeners('uncaughtException').find(f => f.name === 'uncaught');
    process.removeListener('uncaughtException', mochaUncaught);
    process.prependOnceListener('uncaughtException', err => {
      try {
        expect(err.name).to.equal('MongoError');
        expect(err.message).to.match(/error processing query:/);
      } catch (_err) {
        return done(_err);
      }
      return

    
    process.prependListener('uncaughtException', mochaUncaught);
    */
  });

  it('sets status to 400 if hint used with count', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?count=true&hint={ "foogle": 1 }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.body).to.have.property('message', "Hint can't be used with count (400).");
  });

  it('allows adding index hint', async function() {
    await request({
      url: 'http://localhost:8012/api/vegetables?hint={ "_id": 1 }',
      json: true
    });
  });

  it('allows adding index hint', async function() {
    await request({
      url: 'http://localhost:8012/api/vegetables?hint[_id]=1',
      json: true
    });
  });

  it('sets status to 400 if comment used with count', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?count=true&comment=salve',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.body).to.have.property('message', "Comment can't be used with count (400).");
  });

  it('allows adding a query comment', async function() {
    await request({
      url: 'http://localhost:8012/api/vegetables?comment=testing testing 123',
      json: true
    });
  });

  it('should not allow adding an index hint if not enabled', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/fungi?hint={ "_id": 1 }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'Hints are not enabled for this resource (403).'
    );
  });

  it('should ignore query comments if not enabled', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/fungi?comment=testing testing 123',
      json: true
    });
    expect(body).to.have.property('length', 1);
  });

  it('allows querying for distinct values', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?distinct=name',
      json: true
    });
    body.sort();
    expect(body).to.have.property('length', 8);
    expect(body[0]).to.equal('Carrot');
    expect(body[1]).to.equal('Lima Bean');
    expect(body[2]).to.equal('Pea');
    expect(body[3]).to.equal('Radicchio');
    expect(body[4]).to.equal('Shitake');
    expect(body[5]).to.equal('Spinach');
    expect(body[6]).to.equal('Turnip');
    expect(body[7]).to.equal('Zucchini');
  });

  it('allows querying for distinct values restricted by conditions', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/vegetables?distinct=name&conditions={ "name": "Carrot" }',
      json: true
    });
    expect(body).to.have.property('length', 1);
    expect(body[0]).to.equal('Carrot');
  });

  it('should not allow querying for distinct values of deselected paths', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/fungi?distinct=hyphenated-field-name',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(403);
    expect(response.body).to.have.property(
      'message',
      'You may not find distinct values for the requested path (403).'
    );
  });

  it('allows using query operators with _id', async function() {
    const body = await request({
      url:
        'http://localhost:8012/api/vegetables?conditions={ "_id": { "$gt": "111111111111111111111111" } }',
      json: true
    });

    expect(body).to.have.property('length', 8);
    expect(body[0]).to.have.property('name', 'Turnip');
  });

  it('should give a 400 if the query string is unpar using query operators with _id', async function() {
    const response = await request({
      url:
        "http://localhost:8012/api/vegetables?conditions={ '_id': { '$gt': '111111111111111111111111' } }",
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    // before:  'The conditions query string value was not valid JSON: "Unexpected token \'" (400).'
    // after:   'The conditions query string value was not valid JSON: "Unexpected token \' in JSON at position 2" (400).'
    // test changed to be less fragile
    expect(response.body).to.have.property('message');
    expect(response.body.message).to.contain(
      'The conditions query string value was not valid JSON: "Unexpected token \''
    );
  });

  it('disallows $explain by default', async function() {
    const response = await request({
      url: 'http://localhost:8012/api/vegetables?conditions={ "$explain": true }',
      json: true,
      simple: false,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(400);
    expect(response.body).to.have.property(
      'message',
      'Using $explain is disabled for this resource (400).'
    );
  });
});
