// __Dependencies__
const deco = require('deco');
const express = require('express');
const RestError = require('rest-error');

// __Module Definition__
const Controller = (module.exports = deco());

Controller.factory(express.Router);
Controller.decorators(__dirname, [
  'configure',
  'stages',
  'activation',
  'request',
  'query',
  'send',
  'errors'
]);
