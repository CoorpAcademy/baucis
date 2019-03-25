## Getting started :rocket:

To install:

    npm install --save @coorpacademy/baucis

An example of creating a REST API from a couple Mongoose schemata.

``` javascript
// Create a mongoose schema.
const Vegetable = new mongoose.Schema({ name: String });
// Register new models with mongoose.
mongoose.model('vegetable', Vegetable);
// Create a simple controller.  By default these HTTP methods
// are activated: HEAD, GET, POST, PUT, DELETE
baucis.rest('vegetable');
// Create the app and listen for API requests
const app = express();
app.use('/api', baucis.get()); // or baucis()
app.listen(80);
```
### `baucis.rest()`


`baucis.rest()` creates a new controller associated with a given model.

You can pass in a mongoose model name:

``` javascript
const controller = baucis.rest('robot');
```

Or, pass in a Mongoose model:

``` javascript
const controller = baucis.rest(mongoose.model('robot'));
```

Calling `baucis.rest()` also adds the newly created controller to the current API.  When `baucis()` is called, the API is finalized and any subsequent controllers will be added to another API instance.

```javascript
// Creating the first API.
baucis.rest('legume');
const api = baucis.get();
// Creating another API.
baucis.rest('tuber');
const api2 = baucis.get();
```

Controllers also have the usual Express features.  Controllers are Express 4 `Router`.

``` javascript
// Add middleware before API routes
controller.use('/qux', function (request, response, next) {
  // Do something cool…
  next();
});

controller.get('/readme', function (request, response, next) {
  // Send a readme document about the resource (for example)
  next();
});

// Do other stuff...
controller.set('some option name', 'value');
controller.listen(3000);
```

Customize them with Express middleware, including pre-existing modules like `passport`.

Baucis also adds controller the `request` and `query` methods to interact with the baucis interal Mongoose query.  **(See the [middleware section](./middlewares.md).)**

``` javascript
controller.request(function (request, response, next) {
  if (request.isAuthenticated()) return next();
  return response.send(401);
});
```
