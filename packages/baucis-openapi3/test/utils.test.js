const {expect} = require('chai');
const utils = require('../src/utils');

describe('Utils module', function() {
  it('capitalize should handle null', function() {
    expect(utils.capitalize(null)).to.equal(null);
  });
  it('capitalize should handle single chars', function() {
    expect(utils.capitalize('a')).to.equal('A');
  });
  it('capitalize should handle longer strings', function() {
    expect(utils.capitalize('abc')).to.equal('Abc');
  });
});
