// __Dependencies__
const mongoose = require('mongoose');
const semver = require('semver');
const RestError = require('rest-error');
const Model = require('../model');

// __Module Definition__
const decorator = (module.exports = function(model, protect) {
  const controller = this;

  if (typeof model !== 'string' && (!model || !model.schema)) {
    throw RestError.Misconfigured('You must pass in a model or model name');
  }

  // __Property Definitions__
  protect.property('comments', false);
  protect.property('explain', false);
  protect.property('hints', false);
  protect.property('select', '');
  protect.property('sort', '');

  protect.property('versions', '*', function(range) {
    if (semver.validRange(range)) return range;
    throw RestError.Misconfigured(
      'Controller version range "%s" was not a valid semver range',
      range
    );
  });

  protect.property('model', undefined, function(m) {
    // TODO readonly
    if (typeof m === 'string') return mongoose.model(m);
    return m;
  });

  protect.property('fragment', function(value) {
    if (value === undefined) return `/${controller.model().plural()}`;
    if (value.indexOf('/') !== 0) return `/${value}`;
    return value;
  });

  protect.property('findBy', '_id', function(path) {
    const findByPath = controller.model().schema.path(path);
    if (
      !findByPath.options.unique &&
      !(findByPath.options.index && findByPath.options.index.unique)
    ) {
      throw RestError.Misconfigured(
        '`findBy` path for model "%s" must be unique',
        controller.model().modelName
      );
    }
    return path;
  });

  protect.multiproperty('operators', undefined, false);
  protect.multiproperty('methods', 'head get put post delete', true, function(enabled) {
    return !!enabled;
  });

  controller.deselected = function(path) {
    const deselected = controller.model().deselected();
    // Add deselected paths from the controller.
    controller
      .select()
      .split(/\s+/)
      .forEach(function(path) {
        const match = /^(?:[-]((?:[\w]|[-])+)\b)$/.exec(path);
        if (match) deselected.push(match[1]);
      });
    const deduplicated = deselected.filter(function(path, position) {
      return deselected.indexOf(path) === position;
    });

    if (arguments.length === 0) return deduplicated;
    else return deduplicated.indexOf(path) !== -1;
  };

  // Set the controller model.
  controller.model(model);
});
