const RestError = require('rest-error');

// A filter function for checking a given value is defined and not null.
function exists(o) {
  return o !== undefined && o !== null;
}
// Handle variable number of arguments
function last(skip, names, values) {
  const r = {};
  let position = names.length;
  const count = values.filter(exists).length - skip;
  if (count < 1) throw RestError.Misconfigured('Too few arguments.');

  names.forEach(function(name) {
    const index = skip + count - position;
    position--;
    if (index >= skip) r[name] = values[index];
  });
  return r;
}

function isDefinedAndNotNull(n) {
  if (n === null) return false;
  if (n === undefined) return false;
  return true;
}

function isPositiveInteger(n) {
  if (!isDefinedAndNotNull(n)) return false;
  n = Number(n);
  if (n < 1) return false;
  return n === Math.ceil(n);
}

function getAsInt(n) {
  return Math.ceil(Number(n));
}

function isNonNegativeInteger(n) {
  if (!isDefinedAndNotNull(n)) return false;
  n = Number(n);
  if (n < 0) return false;
  return n === Math.ceil(n);
}
module.exports = {
  exists,
  last,
  isDefinedAndNotNull,
  isPositiveInteger,
  getAsInt,
  isNonNegativeInteger
};
