const pluralizer = require('mongoose-legacy-pluralize');
const pluralizeFn = require('pluralize');

module.exports = function(mongoose) {
  function extendModel(model) {
    model._locking = false;
    model.locking = function(value) {
      if (arguments.length === 1) {
        model._locking = value;
        return model;
      } else {
        return model._locking;
      }
    };
    model._lastModified = undefined;
    model.lastModified = function(value) {
      if (arguments.length === 1) {
        model._lastModified = value;
        return model;
      } else {
        return model._lastModified;
      }
    };

    model.deselected = function(path) {
      const deselected = [];
      // Store naming, model, and schema.
      // Find deselected paths in the schema.
      model.schema.eachPath(function(name, path) {
        if (path.options.select === false) deselected.push(name);
      });
      if (arguments.length === 0) return deselected;
      else return deselected.indexOf(path) !== -1;
    };

    model._singular = model.modelName;
    model.singular = function(value) {
      if (arguments.length === 1) {
        model._singular = value;
        return model;
      } else {
        return model._singular;
      }
    };

    model._plural = pluralizer(model.singular(), pluralizeFn);
    model.plural = function(value) {
      if (arguments.length === 1) {
        model._plural = value;
        return model;
      } else {
        return model._plural;
      }
    };
    return model;
  }

  const originalMongooseModel = mongoose.model;
  mongoose.model = function() {
    const m = originalMongooseModel.apply(mongoose, arguments);
    if (!m.singular) {
      extendModel(m);
    }
    return m;
  };
  return extendModel;
};
