// __Dependencies__
var baucis = require('baucis');
var deco = require('deco');
var decorators = deco.require(__dirname, [ 'Controller', 'Api' ]).hash;

baucis.Controller.decorators(decorators.Controller);
baucis.Api.decorators(decorators.Api);
