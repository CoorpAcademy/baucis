Baucis
======

[![Npm version](https://img.shields.io/npm/v/@coorpacademy/baucis.svg)](https://www.npmjs.com/package/@coorpacademy/baucis)
[![Build Status](https://travis-ci.com/CoorpAcademy/baucis.svg?branch=master)](https://travis-ci.com/CoorpAcademy/baucis)

> Build scalable REST APIs using the open source tools and standards you and your team already know — *Mongoose, Express, and Node.js streams*.

Baucis takes the boilerplate out of building and maintaining scalable [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS)/[Level 3](http://martinfowler.com/articles/richardsonMaturityModel.html) REST APIs.

## Features :hammer_and_wrench:

 * Automatically build controllers from your Mongoose schemas, then easily configure them.
 * Built on Express 4 so adding custom middleware is a snap.  Compatible with existing Express middleware.
 * Fully takes advantage of Node.js streaming to nimbly process large datasets.
 * Implements the HTTP specification according to the specifications ([RFC 7231](http://tools.ietf.org/rfcmarkup/7231), etc.)
 * Widely compatible with a variety of front end frameworks.
 * Perform rich queries of the API using an expressive JSON syntax via query string.
 * Supports geolocation and full text search.
 * Version your API using semver.
 * Automatically generate interactive Swagger documentation for the API.
 * Highly customizable, simple interface.  Can be extended with plugins.
 * Compatible with MongoDB 2.x and 3.x
 * Over 140 Mocha.js tests in addition to Express' and Mongoose's.


## Getting Started :rocket:

To install:

    npm install --save @coorpacademy/baucis

``` javascript
const mongoose = require('mongoose');
const express = require('express');
const baucis = require('@coorpacademy/baucis')(mongoose, express)
// Create a mongoose schema.
const Vegetable = new mongoose.Schema({ name: String });
// Register new models with mongoose.
mongoose.model('vegetable', Vegetable);
// Create a simple controller.  By default these HTTP methods
// are activated: HEAD, GET, POST, PUT, DELETE
baucis.rest('vegetable');
// Create the app and listen for API requests
const app = express();
app.use('/api', baucis());
app.listen(4334);
```

## Wanna see/know more?

Head other the main repository on [github](https://github.com/CoorpAcademy/baucis)