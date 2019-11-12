const {expect} = require('chai');

const {swaggerTypeFor} = require('../src/controller');

describe('swaggerTypeFor tag correctly types', function() {
  const itCheckForType = (type, returnValue) =>
    it(type ? type.name : `${type}`, function() {
      expect(swaggerTypeFor(type)).to.equal(returnValue);
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
  itCheckForType({name: '{}'}, null);
  it('throw when not recognize', function() {
    expect(() => swaggerTypeFor('Toto')).to.throw('Unrecognized type: Toto');
  });
});
