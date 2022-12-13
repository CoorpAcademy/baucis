const pluralize = require('pluralize');

module.exports = function(mongoose) {
  mongoose.plugin((schema, options) => {
    schema.static('locking', function(value) {
      if (arguments.length === 1) {
        this._locking = value;
        return this;
      } else {
        return !!this._locking;
      }
    });

    schema.static('lastModified', function(value) {
      if (arguments.length === 1) {
        this._lastModified = value;
        return this;
      } else {
        return this._lastModified;
      }
    });

    schema.static('deselected', function(path) {
      const deselected = [];
      // Store naming, model, and schema.
      // Find deselected paths in the schema.
      schema.eachPath(function(name, schemaType) {
        if (schemaType.options.select === false) deselected.push(name);
      });
      if (arguments.length === 0) return deselected;
      else return deselected.indexOf(path) !== -1;
    });

    schema.static('singular', function(value) {
      this._singular = '_singular' in this ? this._singular : this.modelName;
      if (arguments.length === 1) {
        this._singular = value;
      } else {
        return this._singular;
      }
    });

    schema.static('plural', function(value) {
      this._plural = '_plural' in this ? this._plural : pluralize(this.singular());
      if (arguments.length === 1) {
        this._plural = value;
        return this;
      } else {
        return this._plural;
      }
    });
  });
};
