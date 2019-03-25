const expect = require('expect.js');

const {swaggerTypeFor} = require('../src/controller');

describe('swaggerTypeFor tag correctly types', function() {
  const itCheckForType = (type, returnValue) =>
    it(type ? type.name : `${type}`, function(done) {
      try {
        expect(swaggerTypeFor(type)).to.equal(returnValue);
      } catch (err) {
        return done(err);
      }
      done();
    });
  itCheckForType(undefined, null);
  itCheckForType(false, null);
  itCheckForType(null, null);
  itCheckForType(function Oid() {}, 'string');
  itCheckForType(Date, 'Date');
  itCheckForType(function Array() {}, 'Array');
  itCheckForType(function Buffer() {}, null);
  itCheckForType(function Mixed() {}, null);
  itCheckForType(Object, null);
  itCheckForType({}, null);
  it('throw when not recognize', function(done) {
    try {
      swaggerTypeFor('Toto');
      done(new Error('exception not triggered'));
    } catch (err) {
      try {
        expect(err.message).to.equal('Unrecognized type: Toto');
      } catch (expecterr) {
        return done(expecterr);
      }
      done();
    }
  });
});
