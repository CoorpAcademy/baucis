// Module with helper functions for building OpenAPI parameters metadata

function getParamId() {
  return {
    name: 'id',
    in: 'path',
    description: 'The identifier of the resource.',
    schema: {
      type: 'string'
    },
    required: true
  };
}

function getParamXBaucisUpdateOperator() {
  return {
    name: 'X-Baucis-Update-Operator',
    in: 'header',
    description:
      '**BYPASSES VALIDATION** May be used with PUT to update the document using $push, $pull, or $set. [📖](https://github.com/CoorpAcademy/baucis/documentation/http-headers.md)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamSkip() {
  return {
    name: 'skip',
    in: 'query',
    description:
      'How many documents to skip. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#skip)',
    schema: {
      type: 'integer',
      format: 'int32'
    },
    required: false
  };
}

function getParamLimit() {
  return {
    name: 'limit',
    in: 'query',
    description:
      'The maximum number of documents to send. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#limit)',
    schema: {
      type: 'integer',
      format: 'int32'
    },
    required: false
  };
}

function getParamCount() {
  return {
    name: 'count',
    in: 'query',
    description:
      'Set to true to return count instead of documents. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#count)',
    schema: {
      type: 'boolean'
    },
    required: false
  };
}

function getParamConditions() {
  return {
    name: 'conditions',
    in: 'query',
    description:
      'Set the conditions used to find or remove the document(s). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#conditions)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamSort() {
  return {
    name: 'sort',
    in: 'query',
    description:
      'Set the fields by which to sort. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#sort)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamSelect() {
  return {
    name: 'select',
    in: 'query',
    description:
      'Select which paths will be returned by the query. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#select)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamPopulate() {
  return {
    name: 'populate',
    in: 'query',
    description:
      'Specify which paths to populate. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#populate)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamDistinct() {
  return {
    name: 'distinct',
    in: 'query',
    description:
      'Set to a path name to retrieve an array of distinct values. [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#distinct)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamHint() {
  return {
    name: 'hint',
    in: 'query',
    description:
      'Add an index hint to the query (must be enabled per controller). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#hint)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamComment() {
  return {
    name: 'comment',
    in: 'query',
    description:
      'Add a comment to a query (must be enabled per controller). [📖](https://github.com/CoorpAcademy/baucis/blob/master/documentation/query-string-parameters.md#comment)',
    schema: {
      type: 'string'
    },
    required: false
  };
}

function getParamRef(name) {
  return {
    $ref: `#/components/parameters/${name}`
  };
}

function addOperationSingularParameters(verb, parameters) {
  if (verb === 'put') {
    parameters.push(getParamRef('X-Baucis-Update-Operator'));
  }
}

function addOperationCollectionParameters(verb, parameters) {
  if (verb === 'get') {
    parameters.push(getParamRef('count'));
  }
  if (verb === 'get' || verb === 'delete') {
    parameters.push(
      getParamRef('skip'),
      getParamRef('limit'),
      getParamRef('conditions'),
      getParamRef('distinct'),
      getParamRef('hint'),
      getParamRef('comment')
    );
  }
}

// Generate parameter list for operations
function generateOperationParameters(isInstance, verb) {
  const parameters = [];
  if (isInstance) {
    addOperationSingularParameters(verb, parameters);
  } else {
    addOperationCollectionParameters(verb, parameters);
  }
  return parameters;
}

function addPathSingularParameters(parameters) {
  // Parameters available for singular routes
  parameters.push(getParamRef('id'));
}

function addPathCollectionParameters(parameters) {
  // Common Parameters available for plural routes
  parameters.push(getParamRef('sort'));
}

// Generate parameter list for path: common for several operations
function generatePathParameters(isInstance) {
  const parameters = [];

  // Parameters available for singular and plural routes
  parameters.push(getParamRef('select'), getParamRef('populate'));

  if (isInstance) {
    // Parameters available for singular routes
    addPathSingularParameters(parameters);
  } else {
    addPathCollectionParameters(parameters);
  }
  return parameters;
}

function generateCommonParams() {
  const parameters = {};
  parameters.id = getParamId();
  parameters.skip = getParamSkip();
  parameters.limit = getParamLimit();
  parameters.count = getParamCount();
  parameters.conditions = getParamConditions();
  parameters.sort = getParamSort();
  parameters.distinct = getParamDistinct();
  parameters.hint = getParamHint();
  parameters.comment = getParamComment();
  parameters.select = getParamSelect();
  parameters.populate = getParamPopulate();
  parameters['X-Baucis-Update-Operator'] = getParamXBaucisUpdateOperator();
  return parameters;
}

module.exports = {
  generateOperationParameters,
  generatePathParameters,
  generateCommonParams
};
