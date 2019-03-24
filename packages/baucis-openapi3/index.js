const extendApi = require('./src/api');
const extendController = require('./src/controller');
const {buildOptions, buildServerVariables, ensureHasInfo} = require('./src/options-builder');

module.exports = baucis => {
  baucis.Api.addExtension(extendApi);
  baucis.Controller.addExtension(extendController);
  return baucis;
};
module.exports.buildOptions = buildOptions;
module.exports.buildServerVariables = buildServerVariables;
module.exports.ensureHasInfo = ensureHasInfo;
