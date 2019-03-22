// __Dependencies__
const path = require('path');
const deco = require('deco');
const express = require('express');
// __Module Definition__
const Controller = deco();

Controller.factory(express.Router);
Controller.decorators(path.join(__dirname, 'controller'), [
  'configure',
  'MERGE',
  'query',
  'send',
  'errors'
]);
module.exports = Controller;
