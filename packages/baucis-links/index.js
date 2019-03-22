'use strict';

var middleware = require('./middleware');

// __Module Definition__
var decorator = module.exports = function () {
  var baucis = this;
  baucis.Controller.decorators(middleware);
};
