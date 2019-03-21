// __Dependencies__
const deco = require('deco');

// __Module Definition__
module.exports = deco(__dirname, [
  // __Query-Stage Middleware__
  'create',
  'update',
  'build',
  'options'
]);
