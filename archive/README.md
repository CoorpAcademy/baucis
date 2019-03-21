# baucis

![Codeship](https://codeship.com/projects/43c2fac0-bfa5-0133-3ab4-4e7013906a8c/status?branch=master)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/wprl/baucis?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![NPM](https://nodei.co/npm/baucis.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/baucis/)

Build scalable REST APIs using the open source tools and standards you and your team already know — *Mongoose, Express, and Node.js streams*.  Baucis takes the boilerplate out of building and maintaining scalable [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS)/[Level 3](http://martinfowler.com/articles/richardsonMaturityModel.html) REST APIs.

Baucis has tens of thousands of users and is used in production by startups, departments, and Fortune 500 companies, and at hackathons and conferences worldwide.  MongoDB, Inc. awarded baucis first place in their 2014 Open Source Hack Contest.

Baucis is easy for beginners, easy to scale, yet flexible enough in the long term to be extended to solve complex use cases.

### Who's using Baucis?

[![Hivepod.io](http://github.com/wprl/baucis/raw/master/hivepod-io-logo.png "Hivepod.io")](https://hivepod.io) [![Kun.io App Studio LLC](http://github.com/wprl/baucis/raw/master/kunio.png "Kun.io App Studio LLC")](http://kun.io) [![Pixel Press](http://github.com/wprl/baucis/raw/master/pixel-press.jpg "Pixel Press")](http://www.projectpixelpress.com)

If you like baucis please consider adding bounties to issues in the [issue tracker](https://github.com/wprl/baucis/issues) or contributing via [GitTip](https://www.gittip.com/wprl/).


## Features

 * Automatically build controllers from your Mongoose schemata, then easily configure them.
 * Built on Express 4 so adding custom middleware is a snap.  Compatible with existing Express middleware.
 * Fully takes advantage of Node.js streaming to nimbly process large datasets.
 * Implements the HTTP specification according to the specifications ([RFC 7231](http://tools.ietf.org/rfcmarkup/7231), etc.)
 * Widely compatible with a variety of front end frameworks.
 * Perform rich queries of the API using an expressive JSON syntax via query string.
 * Supports geolocation and full text search.
 * Version your API using semver.
 * Automatically generate interactive Swagger documentation for the API.
 * Highly customizable, simple interface.  Can be extended with plugins (decorators).
 * Compatible with MongoDB 2.x and 3.x
 * Over 140 Mocha.js tests in addition to Express' and Mongoose's.


## Getting Started

To install:

    npm install --save baucis

It's easy to create an API from a Mongoose model:

``` javascript
// Create a mongoose schema.
var Vegetable = new mongoose.Schema({ name: String });
// Register new models with mongoose.
mongoose.model('vegetable', Vegetable);
// Create a simple controller.  By default these HTTP methods
// are activated: HEAD, GET, POST, PUT, DELETE
baucis.rest('vegetable');
// Create the app and listen for API requests
var app = express();
app.use('/api', baucis());
app.listen(8012);
```

That's it!  Now you have an RFC-compliant, flexible, and semantically rich API dealing with vegetables.  You could access it with URLs like `http://localhost:8012/api/vegetables`.  CRUD is supported using [GET, PUT, POST, and DELETE](https://github.com/wprl/baucis/wiki/HTTP-Verbs).


## Examples

 * [Example REST API server built with Node and Baucis](//github.com/wprl/baucis-example)
 * [Examples with Backbone.js](examples/Backbone.js)
 * [Examples with AngularJS](examples/angular-example-resource.html)
 * [Examples with Restangular](examples/angular-example-restangular.html)
 * [Examples with jQuery](examples/jQuery.js)
 * [mongoose-administration-example](https://www.npmjs.org/package/mongoose-administration-example)


## Documentation

[Check out the Wiki](https://github.com/wprl/baucis/wiki) for documentation and more in-depth information about baucis.  Check the [change log](CHANGES.md) for info on recently implemented features.


## Coming Soon

 * Real time browser/client [subscription with EventSource](https://github.com/wprl/baucis-subscribe) (server sent events)
 * [Web hooks](https://github.com/wprl/baucis-hooks)
 * To see everything that's in store [visit the GitHub milestones page](https://github.com/wprl/baucis/milestones) for this repo.


## Contact

 * Twitter [@wprl](https://twitter.com/wprl)
 * [LinkedIn](https://linkedin.com/in/willprl)
 * Email [william@kun.io](mailto:william@kun.io)

&copy; 2012-2015 Kun.io App Studio LLC

