const {expect} = require('chai');
const request = require('request-promise').defaults({json: true});

const fixtures = require('./fixtures');

describe('Headers', function() {
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

  it('sets Last-Modified for single documents', async function() {
    const turnip = vegetables[0];
    const {headers, statusCode} = await request({
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      method: 'HEAD',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    expect(headers).to.have.property('last-modified');
    const modified = headers['last-modified'];
    const httpDate = new Date(modified).toUTCString();
    expect(modified).to.equal(httpDate);
    const response = await request({
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      resolveWithFullResponse: true
    });

    expect(response.statusCode).to.equal(200);
    expect(response.headers).to.have.property('last-modified', httpDate);
  });

  it('sets Last-Modified for the collection', async function() {
    const updates = vegetables.map(vegetable => vegetable.lastModified);
    const max = new Date(Math.max.apply(null, updates));
    const httpDate = new Date(max).toUTCString();

    const {headers, statusCode} = await request({
      url: 'http://localhost:8012/api/vegetables',
      method: 'HEAD',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    expect(headers).to.have.property('last-modified', httpDate);
    const response = await request({
      uri: 'http://localhost:8012/api/vegetables',
      resolveWithFullResponse: true
    });

    expect(response.statusCode).to.equal(200);
    expect(response.headers.trailer).to.equal('Last-Modified, Etag');
    expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
    expect(response.headers['transfer-encoding']).to.equal('chunked');
    expect(response.trailers).to.have.property('last-modified', httpDate);
  });

  it('sets Etag for single documents', async function() {
    const turnip = vegetables[0];
    const {headers, statusCode} = await request({
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      method: 'HEAD',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    const {etag} = headers;
    expect(etag).to.match(/^"[0-9a-z]{32}"$/);
    const response = await request({
      url: `http://localhost:8012/api/vegetables/${turnip._id}`,
      resolveWithFullResponse: true
    });

    expect(response.statusCode).to.equal(200);
    expect(response.headers.etag).to.equal(etag);
  });

  it('sets Etag for the collection', async function() {
    const {headers, statusCode} = await request({
      url: 'http://localhost:8012/api/vegetables',
      method: 'HEAD',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    const {etag} = headers;
    expect(etag).to.match(/^"[0-9a-z]{32}"$/);
    const response = await request({
      url: 'http://localhost:8012/api/vegetables',
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(200);
    expect(response.headers.trailer).to.equal('Last-Modified, Etag');
    expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
    expect(response.headers['transfer-encoding']).to.equal('chunked');
    expect(response.trailers.etag).to.equal(etag);
  });

  it('sets Allowed', async function() {
    const {headers, statusCode} = await request({
      url: 'http://localhost:8012/api/vegetables',
      method: 'HEAD',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    expect(headers).to.have.property('allow', 'HEAD,GET,POST,PUT,DELETE');
  });

  it('sends 406 Not Acceptable when the requested type is not accepted', async function() {
    const {body, statusCode, headers} = await request({
      url: 'http://localhost:8012/api/vegetables',
      headers: {
        Accept: 'application/xml'
      },
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(406);
    expect(headers).to.have.property('content-type', 'text/html; charset=utf-8');
    expect(body).to.contain(
      'Not Acceptable: The requested content type could not be provided (406).'
    );
  });

  it('should send 415 Unsupported Media Type when the request content type cannot be parsed', async function() {
    const {body, statusCode} = await request({
      url: 'http://localhost:8012/api/vegetables',
      headers: {
        'Content-Type': 'application/xml'
      },
      method: 'POST',
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(415);
    expect(body).to.have.property('message', "The request's content type is unsupported (415).");
  });

  it('should match the correct MIME type, ignoring extra options and linear whitespace', async function() {
    await request({
      url: 'http://localhost:8012/api/vegetables',
      method: 'POST',
      headers: {
        'Content-Type':
          '     application/json        ;       charset=UTF-8    cheese=roquefort      '
      },
      json: true,
      body: {name: 'Tomatillo'}
    });
  });

  it('should not set X-Powered-By', async function() {
    const {headers, statusCode} = await request({
      url: 'http://localhost:8012/api/vegetables',
      method: 'HEAD',
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(200);
    expect(headers).not.to.have.property('x-powered-by');
  });
});
