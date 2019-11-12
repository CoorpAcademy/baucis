const {expect} = require('chai');
const utils = require('../src/utils');

describe('Utils module', function() {
  it('capitalize should handle null', function(done) {
    expect(utils.capitalize(null)).to.equal(null);
    done();
  });
  it('capitalize should handle single chars', function(done) {
    expect(utils.capitalize('a')).to.equal('A');
    done();
  });
  it('capitalize should handle longer strings', function(done) {
    expect(utils.capitalize('abc')).to.equal('Abc');
    done();
  });
});
