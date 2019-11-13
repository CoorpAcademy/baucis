const {expect} = require('chai');
const request = require('request-promise').defaults({json: true});

const fixtures = require('./fixtures');

describe.skip('OPTIONS instance/collection', function() {
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

  it('provides options for the collection', async function() {
    const {body, headers} = await request({
      method: 'OPTIONS',
      url: 'http://localhost:8012/api/vegetables/',
      resolveWithFullResponse: true
    });
    expect(body).to.equal('HEAD,GET,POST,PUT,DELETE');

    expect(headers).to.have.property('vary', 'API-Version');
    expect(headers).to.have.property('api-version', '0.0.1');
    expect(headers).to.have.property('allow', 'HEAD,GET,POST,PUT,DELETE');
    expect(headers).to.have.property('date');
    expect(headers).to.have.property('connection', 'keep-alive');
  });

  it('provides options for the instance', async function() {
    const shitake = vegetables[3];
    const {body, headers} = await request({
      method: 'OPTIONS',
      url: `http://localhost:8012/api/vegetables/${shitake._id}`,
      resolveWithFullResponse: true
    });

    expect(body).to.equal('HEAD,GET,POST,PUT,DELETE');

    expect(headers).to.have.property('vary', 'API-Version');
    expect(headers).to.have.property('api-version', '0.0.1');
    expect(headers).to.have.property('allow', 'HEAD,GET,POST,PUT,DELETE');
    expect(headers).to.have.property('date');
    expect(headers).to.have.property('connection', 'keep-alive');
  });
});
