const extendApi = require('./src/api');
const extendController = require('./src/controller');

module.exports = baucis => {
  baucis.Api.addExtension(extendApi);
  baucis.Controller.addExtension(extendController);
  return baucis;
};
