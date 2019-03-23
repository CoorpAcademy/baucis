const path = require('path');
const deco = require('deco');
const extendApi = require('./src/api');

module.exports = baucis => {
  const {controller} = deco.require(path.join(__dirname, 'src'), ['controller']).hash;
  baucis.Api.addExtension(extendApi);
  baucis.Controller.decorators(controller);
  baucis.Api.Controller = baucis.Controller;
  return baucis;
};
