// __Dependencies__
const deco = require('deco');

// __Module Definition__
const middleware = (module.exports = deco(__dirname, [
  'allow',
  'validation',
  'conditions',
  'streams'
]));
