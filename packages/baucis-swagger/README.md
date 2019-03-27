baucis-swagger
==============

[![Npm version](https://img.shields.io/npm/v/@coorpacademy/baucis-swagger.svg)](https://www.npmjs.com/package/@coorpacademy/baucis-swagger)
[![Build Status](https://travis-ci.com/CoorpAcademy/baucis.svg?branch=master)](https://travis-ci.com/CoorpAcademy/baucis)

:warning: This is a **fork** from the Coorpacademy Tech team :warning:

This is so far intended for intern use

--------

This module generates customizable swagger definitions for your Baucis API.  Use this module in conjunction with [Baucis](https://github.com/Coorpacademy/baucis).

    npm install --save @coorpacademy/baucis @coorpacademy/baucis-swagger

It is very easy to use.  Include the package after baucis is included, and before your API is built.

```js
const express = require('express');
const baucis = require('@coorpacademy/baucis')(mongoose, express);
const swagger = require('@coorpacademy/baucis-swagger');

baucis.addPlugin(swagger)
const app = express();

// ... Set up a mongoose schema ...

baucis.rest('vegetable');
app.use('/api', baucis());
```
Then, access e.g. `GET http://localhost:3333/api/documentation`.  See the [Baucis](https://github.com/wprl/baucis) repo for more information about building REST APIs with [Baucis](https://github.com/wprl/baucis).

If you want to modify the swagger definition, generate the definition first.  (This will happen automatically otherwise.)

```javascript
controller.generateSwagger();
controller.swagger.xyz = '123';
```

If you wish to disable the Invalid type warning, you can load the plugin with the following options:

```javascript
baucis.addPlugin(swagger.withOptions({noWarning: true}));
```
