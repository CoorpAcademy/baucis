// __Dependencies__
const path = require('path');
const baucis = require('@coorpacademy/baucis');
const deco = require('deco');

const decorators = deco.require(path.join(__dirname, 'src'), ['controller', 'api']).hash;

baucis.Controller.decorators(decorators.controller);
baucis.Api.decorators(decorators.api);
