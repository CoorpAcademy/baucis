## Extending Baucis

Baucis can be augmented via Express middleware, incoming and outgoing streams, as well as with decorators.

Add decorators to Controllers and other baucis constructors by using the `decorators` method.  Adding a decorator will affect all subsequently created controllers.  Here's how you could add a tiny plugin that makes all subsequently added controllers check authentication for all PUTs and POSTs.
``` javascript
baucis.Controller.decorators(function (options, protect) {
  var controller = this;
  controller.request('put post', function (request, response, next) {
    if (!request.isAuthenticated()) return next(new Error());
    next();
  });
});
```
