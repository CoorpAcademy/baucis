const extendApi = require('./src/api');
const extendController = require('./src/controller');
const {buildOptions, buildServerVariables, ensureHasInfo} = require('./src/options-builder');

const extendBaucis = (baucis, options) => {
  baucis.Api.addExtension(extendApi(options));
  baucis.Controller.addExtension(extendController(options));
  return baucis;
};

module.exports = baucis => extendBaucis(baucis, {});
module.exports.withOptions = options => baucis => extendBaucis(baucis, options);
module.exports.buildOptions = buildOptions;
module.exports.buildServerVariables = buildServerVariables;
module.exports.ensureHasInfo = ensureHasInfo;
