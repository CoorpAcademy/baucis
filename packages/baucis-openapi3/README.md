baucis-openapi3
===============

[![Npm version](https://img.shields.io/npm/v/@coorpacademy/baucis-openapi3.svg)](https://www.npmjs.com/package/@coorpacademy/baucis-openapi3)
[![Build Status](https://travis-ci.com/CoorpAcademy/baucis.svg?branch=master)](https://travis-ci.com/CoorpAcademy/baucis)

:warning: This is a **fork** from the Coorpacademy Tech team :warning:

This is so far intended for intern use

--------

This module generates customizable [OpenAPI 3.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md) definitions for your Baucis API.
Use this module in conjunction with [Baucis](https://github.com/wprl/baucis).


## Usage

Install with:

    npm install --save @coorpacademy/baucis @coorpacademy/baucis-openapi3

Include the package after baucis is included, and before your API is built.

```javascript
const express = require('express');
const baucis = require('@coorpacademy/baucis')(express, mongoose);
const apiDoc = require('@coorpacademy/baucis-openapi3');
baucis.addPlugin(apiDoc);

const app = express();

// ... Set up a mongoose schema ...

baucis.rest('vegetable');
app.use('/api', baucis());
```

Then, access e.g. `GET http://localhost:3333/api/openapi.json`.  See the [Baucis](https://github.com/Coorpacademy/baucis) repo for more information about building REST APIs with [Baucis](https://github.com/Coorpacademy/baucis).

## Tests

Change the `test/fixures/config.json` if needed, to point to a valid mongodb database.
Then run:

```bash
npm test
```


## Extensibility

If you want to modify the OpenAPI definition, generate the definition first.  (This will happen automatically otherwise.)

Use the `openApi3` member of the controller to extend `paths` and `components` per controller.

```javascript
controller.generateOpenApi3();
controller.openApi3.paths.xyz = '123';
controller.openApi3.components.schemas.xyz = {};
```

Or use the `openApi3Document` of the baucis instance module to access and modify dirrecty the full document after calling `generateOpenApi3()` on the API.

```javascript
const baucisInstance = baucis();

//generate standard template for OpenAPI3
baucisInstance.generateOpenApi3();
//extend OpenAPI3 definitions
baucisInstance.openApi3Document.info.title = "myApi";

app.use('/api', baucisInstance);
```

## Backward compatibility

In case you want to provide an easy transition as possible for your current API clients. You can expose both API descriptions at the same time including both modules:

```javascript
    const express = require('express');
    const baucis = require('@coorpacademy/baucis');
    const swagger = require('@coorpacademy/baucis-swagger');
    const swagger2 = require('@coorpacademy/baucis-swagger2');
    const openapi3 = require('@coorpacademy/baucis-openapi3');

    const app = express();

    // ... Set up a mongoose schema ...

    baucis.rest('vegetable');
    app.use('/api', baucis());
```

After that:
- Swagger 1.1 doc will be exposed at `/api/documentation`
- Swagger 2.0 doc will be exposed at `/api/swagger.json`
- OpenAPI 3.0 doc will be exposed at `/api/openapi.json`


## Contact
Via issue on the repository
