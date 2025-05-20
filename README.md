# baucis

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Npm version](https://img.shields.io/npm/v/@coorpacademy/baucis.svg)](https://www.npmjs.com/package/@coorpacademy/baucis)
[![Build Status](https://app.travis-ci.com/CoorpAcademy/baucis.svg?token=KnYzxEMEXjZwczDR8x2L&branch=master)](https://travis-ci.com/CoorpAcademy/baucis)
[![codecov](https://codecov.io/gh/CoorpAcademy/baucis/branch/master/graph/badge.svg)](https://codecov.io/gh/CoorpAcademy/baucis)

> Build scalable REST APIs using the open source tools and standards you and your team already know — *Mongoose, Express, and Node.js streams*.

Baucis takes the boilerplate out of building and maintaining scalable [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS)/[Level 3](http://martinfowler.com/articles/richardsonMaturityModel.html) REST APIs.


:warning: This is a **fork** from the *Coorpacademy Tech Team* :warning:

This is so far intended for intern use

## About this fork :book:

This fork adapt the internal structure of baucis, and the plugin system.
It consist in a monorepros hosting the main baucis plugins (adapted to the new system).

One other major changes is that it enable you to inject the version of express or mongoose you want,
getting ride of the mongoose <5 constraint.

Packages are release for the moment under `@coorpacademy/` scope, but this is subject to change if the fork
happens to be working and interest span out coorpacademy

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

It's easy to create an API from a Mongoose model:

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
app.listen(4312);
```

That's it!  Now you have an RFC-compliant, flexible, and semantically rich API dealing with vegetables.  You could access it with URLs like `http://localhost:4312/api/vegetables`.  CRUD is supported using [GET, PUT, POST, and DELETE](https://github.com/wprl/baucis/wiki/HTTP-Verbs).


## Examples :national_park:

Some new example is present in the [examples](./examples) folder. It make use of swagger plugins so you can directly
have some explorer disponible when you run it.

## Documentation :closed_book:

[Check out the Doc](./documention) for more in-depth information about baucis.

Check the [change log](CHANGES.md) for info on recently implemented features.
