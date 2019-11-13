const {expect} = require('chai');
const request = require('request-promise');

const fixtures = require('./fixtures');

describe('PUT singular', function() {
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

  it('should replace the addressed object if it exists', async function() {
    const radicchio = vegetables[7];
    const body = await request({
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: true
    });
    expect(body).to.have.property('name', 'Radicchio');

    // put the leek on the server
    const response = await request({
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: {
        name: 'Leek'
      },
      method: 'PUT',
      resolveWithFullResponse: true
    });
    expect(response.statusCode).to.equal(200);
    expect(response.headers).to.not.have.property('location');

    const leekId = radicchio._id;
    const leek = await request({
      url: `http://localhost:8012/api/vegetables/${leekId}`,
      json: true
    });
    expect(leek).to.have.property('name', 'Leek');
  });

  it('should 422 on no document', async function() {
    const radicchio = vegetables[7];
    const radicchioBody = await request({
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: true
    });
    expect(radicchioBody).to.have.property('name', 'Radicchio');

    // put the leek on the server
    const response = await request({
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      method: 'PUT',
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });
    expect(response.statusCode).to.equal(422);
    expect(response.body).to.eql([
      {
        message: 'The request body did not contain an update document',
        name: 'RestError'
      }
    ]);
  });

  it('should 422 on multiple documents', async function() {
    const radicchio = vegetables[7];
    const radicchioBody = await request({
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: true
    });
    expect(radicchioBody).to.have.property('name', 'Radicchio');

    // Put some veggies on the server.
    const {statusCode, body} = await request({
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: [{name: 'Pea Shoot'}, {name: 'Bitter Melon'}],
      method: 'PUT',
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(422);
    expect(body).to.eql([
      {
        message: 'The request body contained more than one update document',
        name: 'RestError'
      }
    ]);
  });

  it('should only allow updates', async function() {
    const id = 'badbadbadbadbadbadbadbad';
    const responseGet = await request({
      url: `http://localhost:8012/api/vegetables/${id}`,
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });
    // First check it's not there
    expect(responseGet.statusCode).to.equal(404);
    expect(responseGet.body).to.have.property(
      'message',
      'Nothing matched the requested query (404).'
    );

    // Attempt to update non-existant doc
    const responsePut = await request({
      url: `http://localhost:8012/api/vegetables/${id}`,
      json: {name: 'Cucumber'},
      method: 'PUT',
      resolveWithFullResponse: true,
      simple: false
    });
    expect(responsePut.statusCode).to.equal(404);
    expect(responsePut.body).to.have.property(
      'message',
      'Nothing matched the requested query (404).'
    );

    // Make sure it wasn't created
    const reponseGetTwo = await request({
      url: `http://localhost:8012/api/vegetables/${id}`,
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });
    expect(reponseGetTwo.statusCode).to.equal(404);
    expect(reponseGetTwo.body).to.have.property(
      'message',
      'Nothing matched the requested query (404).'
    );
  });

  it('should fire pre save Mongoose middleware', async function() {
    fixtures.vegetable.saveCount = 0;

    const radicchio = vegetables[7];
    await request({
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      json: {name: 'Radicchio di Treviso'},
      method: 'PUT'
    });
    expect(fixtures.vegetable.saveCount).to.equal(1);
  });

  it('should allow running validation with methods that currently bypass validation ... maybe');
  it('should always select the version key when locking is enabled ... maybe');
});
