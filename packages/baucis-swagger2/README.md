baucis-swagger2
===============

[![Npm version](https://img.shields.io/npm/v/@coorpacademy/baucis-swagger2.svg)](https://www.npmjs.com/package/@coorpacademy/baucis-swagger2)
[![Build Status](https://travis-ci.com/CoorpAcademy/baucis.svg?branch=master)](https://travis-ci.com/CoorpAcademy/baucis)

:warning: This is a **fork** from the Coorpacademy Tech team :warning:

This is so far intended for intern use

------
This module generates customizable swagger 2.0 definitions for your Baucis API.
Use this module in conjunction with [Baucis](https://github.com/Coorpacademy/baucis).

## Usage

Install with:

    npm install --save @coorpacademy/baucis @coorpacademy/baucis-swagger2

It is very easy to use.  Include the package after baucis is included, and before your API is built.

```js
    const express = require('express');
    const baucis = require('@coorpacademy/baucis')(mongoose, express);
    const apiDoc = require('@coorpacademy/baucis-swagger2');

    baucis.addPlugin(apiDoc);

    const app = express();

    // ... Set up a mongoose schema ...

    baucis.rest('vegetable');
    app.use('/api', baucis())
```

Then, access e.g. `GET http://localhost:3333/api/swagger.json`.  See the [Baucis](https://github.com/wprl/baucis) repo for more information about building REST APIs with [Baucis](https://github.com/wprl/baucis).

## Tests
Change the `test/fixures/config.json` to point to a valid mongodb database.
Then run:

```
npm test
```


## Extensibility

If you want to modify the swagger definition, generate the definition first.  (This will happen automatically otherwise.)

Use the `swagger2` member of the controller to extend `paths` and `definitions` per controller.

```javascript
controller.generateSwagger2();
controller.swagger2.paths.xyz = '123';
controller.swagger2.definitions.xyz = {};
```

Or use the `swagger2Document` of the baucis instance module to access and modify dirrecty the full swagger document after calling generateSwagger() on the API.

```javascript
const baucisInstance = baucis();

//generate standard template for Swagger 2
baucisInstance.generateSwagger2();
//extend Swagger2 definitions
baucisInstance.swagger2Document.info.title = "myApi";
baucisInstance.swagger2Document.host = "api.weylandindustries.com:5000";

app.use('/api', baucisInstance);
```

## Base

This module is  originaly an evolution of the great [baucis-swagger](https://github.com/wprl/baucis-swagger) addressing swagger version 1.0.
This version is a fork of the previous one to provide an API description compliant with the [Swagger 2.0 Specs](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md)

In discussion with @wprl, it was decided to fork to keep codebase small and maintainable for both versions.

# Backward compatibility

In case you want to provide an easy transition as possible for your current API clients. You can expose both API descriptions at the same time including both modules:

```js
const express = require('express');
const baucis = require('@coorpacademy/baucis')(mongoose, express);
const swagger = require('@coorpacademy/baucis-swagger');
const swagger2 = require('@coorpacademy/baucis-swagger2');

baucis.addPlugin(swagger, swagger2)

const app = express();

// ... Set up a mongoose schema ...

baucis.rest('vegetable');
app.use('/api', baucis());
```

After that:
- Swagger 1.1 doc will be exposed in `/api/documentation`
- Swagger 2.0 doc will be exposed in `/api/swagger.json`
`

## Contact
Via issue on the repository
