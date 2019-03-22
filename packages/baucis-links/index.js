'use strict';

const middleware = require('./middleware');

module.exports = function() {
  const baucis = this;
  baucis.Controller.decorators(middleware);
};
