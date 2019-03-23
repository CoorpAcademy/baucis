const expect = require('expect.js');
const utils = require('../src/utils');

describe('Utils module', function() {
  it('capitalize should handle null', function(done) {
    expect(utils.capitalize(null)).to.be(null);
    done();
  });
  it('capitalize should handle single chars', function(done) {
    expect(utils.capitalize('a')).to.be('A');
    done();
  });
  it('capitalize should handle longer strings', function(done) {
    expect(utils.capitalize('abc')).to.be('Abc');
    done();
  });
});
