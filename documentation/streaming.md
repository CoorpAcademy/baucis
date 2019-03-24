Baucis takes full advantage of Node streams internally to offer even more performance, especially when dealing with large datasets.  Both outgoing and incoming documents are streamed!

To alter or inspect documents being sent or process, add a through stream that transforms or processes them.  As a shortcut, a map function can be passed in.  It will be used to create a map stream internally.  Here's an example of adding a stream to alter POST'd or PUT'd request bodies:

``` javascript
controller.request(function (request, response, next) {
  request.baucis.incoming(function (context, callback) {
    context.incoming.name = 'Feverfew';
    callback(null, context);
  });
  next();
});
```

For PUT requests, the document is available to the stream.  For POSTs `context.doc` will be set to `null`.

``` javascript
controller.request(function (request, response, next) {
  request.baucis.incoming(function (context, callback) {
    if (context.doc.created !== context.incoming.created) {
      callback(baucis.errors.Forbidden('The created date cannot be updated'));
      return;
    }
    callback(null, context);
  });
  next();
});
```

Passing in through streams is also allowed.  Here's an example using the [through module](https://www.npmjs.org/package/through) to create a stream that checks for a forbidden sort of whiskey and alters the name of incoming (POSTed) documents.

``` javascript
controller.request(function (request, response, next) {
  request.baucis.incoming(through(function (context) {
    if (context.incoming.whiskey === 'Canadian') {
      // Errors will be passed off to `next` later, and the stream will
      // be stopped.
      this.emit('error', baucis.errors.Forbidden('Too smooth.'));
      return;
    }
    context.incoming.name = 'SHAZAM';
    this.queue(context);
  }));
  next();
});
```

If `request.baucis.incoming` or `request.baucis.outgoing` is called multiple times, the multiple through streams will be piped together.

Here's an example of how a stream that interacts with outgoing documents may be added:

``` javascript
controller.request(function (request, response, next) {
  request.baucis.outgoing(through(function (context) {
    if (context.doc.owner !== request.user) {
      // Errors will be passed off to `next` later, and the stream will
      // be stopped.
      this.emit('error', baucis.errors.Forbidden());
      return;
    }
    context.doc.password = undefined;
    this.queue(context);
  }));
  next();
});
```

-----------

  * For POSTs, if `request.body` is present, the incoming request will be parsed as a whole, negating many of the benefits of streaming.  However, especially when POSTing only one new document at a time, this is not an issue.  If you want to POST many objects at once, using the default streaming behavior is highly recommened.
  * If you set `request.baucis.documents`, this will be streamed out instead of the Mongoose query results.
  * The document stage of middleware has been deprecated.  Use an outgoing through stream instead.
  