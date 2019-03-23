Baucis adds middleware registration functions for two stages of the request cycle:

### request

This stage of middleware will be called after baucis applies defaults based on the request, but before the Mongoose query is generated.

### query

This stage of middleware will be called after baucis applies defaults to the Mongoose query object, but before the documents are streamed out through the response.  The Mongoose query can be accessed and changed in your custom middleware via `request.baucis.query`.  Query middleware cannot be added explicitly for POST and will be ignored when added for POST implicitly.

### How to use baucis middleware

To apply middleware to all API routes, just pass the function or array to the method for the appropriate stage:

``` javascript
controller.request(function (request, response, next) {
  if (request.isAuthenticated()) return next();
  return response.send(401);
});

controller.query(function (request, response, next) {
  request.baucis.query.populate('fences');
  next();
});
```

To add middleware that applies only to specific HTTP methods, use the second form.  It adds a parameter that must contain a space delimted list of HTTP methods that the middleware should be applied to.

``` javascript
controller.query('head get', function (request, response, next) {
  request.baucis.query.limit(5);
  next();
});
```

The final form is the most specific.  The first argument lets you specify whether the middleware applies to document instances (paths like `/cheeses/:id`) or to collection requests (paths like `/cheeses`).

``` javascript
controller.request('instance', 'head get delete', middleware);
controller.request('collection', 'post', middleware);
```