const errors = require('restify-errors');
const _ = require('lodash/fp');

const exist = _.negate(_.isNil);

// Handle variable number of arguments
function last(skip, names, values) {
  const r = {};
  let position = names.length;
  const count = values.filter(exist).length - skip;
  if (count < 1) throw new errors.InternalServerError('Misconfigured: Too few arguments.');

  names.forEach(function(name) {
    const index = skip + count - position;
    position--;
    if (index >= skip) r[name] = values[index];
  });
  return r;
}

function isPositiveInteger(n) {
  if (_.isNil(n)) return false;
  n = Number(n);
  if (n < 1) return false;
  return n === Math.ceil(n);
}

function getAsInt(n) {
  return Math.ceil(Number(n));
}

function isNonNegativeInteger(n) {
  if (_.isNil(n)) return false;
  n = Number(n);
  if (n < 0) return false;
  return n === Math.ceil(n);
}
module.exports = {
  last,
  isPositiveInteger,
  getAsInt,
  isNonNegativeInteger
};
