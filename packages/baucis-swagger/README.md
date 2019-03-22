baucis-swagger
==============

[![Npm version](https://img.shields.io/npm/v/@coorpacademy/baucis-swagger.svg)](https://www.npmjs.com/package/@coorpacademy/baucis-swagger
[![Build Status](https://travis-ci.com/CoorpAcademy/baucis-swagger.svg?branch=master)](https://travis-ci.com/CoorpAcademy/baucis-swagger)
[![codecov](https://codecov.io/gh/CoorpAcademy/baucis-swagger/branch/master/graph/badge.svg)](https://codecov.io/gh/CoorpAcademy/baucis-swagger)

:warning: This is a from the Coorpacademy Tech team :warning:
This is so far intended for intern use

--------

This module generates customizable swagger definitions for your Baucis API.  Use this module in conjunction with [Baucis](https://github.com/wprl/baucis).

    npm install --save baucis baucis-swagger

It is very easy to use.  Include the package after baucis is included, and before your API is built.

    var express = require('express');
    var baucis = require('baucis');
    var swagger = require('baucis-swagger');

    var app = express();

    // ... Set up a mongoose schema ...

    baucis.rest('vegetable');
    app.use('/api', baucis());

Then, access e.g. `GET http://localhost:3333/api/documentation`.  See the [Baucis](https://github.com/wprl/baucis) repo for more information about building REST APIs with [Baucis](https://github.com/wprl/baucis).

If you want to modify the swagger definition, generate the definition first.  (This will happen automatically otherwise.)

```javascript
controller.generateSwagger();
controller.swagger.xyz = '123';
```
