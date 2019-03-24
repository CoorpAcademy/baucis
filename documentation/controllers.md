## Controllers :man_technologist:

### `controller.mode()`

This property sets the controller's mongoose model.  You can pass in a string or a directly pass in a mongoose model.

``` javascript
controller.model('cheese');
```

### `controller.select()`

Select or deselect fields for all queries.

``` javascript
controller.select('field -password');
controller.select('+groats');
```

Note that mixing inluding and excluding fields causes an error.

### `controller.relations()`

By default the response Link header is set with various useful links based on context.  This is especially useful for paging.  May be disabled using this method.

``` javascript
controller.relations(false);
```

### `controller.findBy()`

The unique path used to identify documents for this controller.  Defaults to `_id`.

``` javascript
controller.findBy('name');
```

### `controller.hints()`

Allow sending an index hint for the query from the client.  Disabled by default.

``` javascript
controller.hints(true);
```

### `controller.comments()`

Allow sending a query comment from the client.  Disabled by default.

``` javascript
controller.comments(true);
```

### `controller.methods()`

Used to disable specific HTTP methods for the controller.

``` javascript
controller.methods('post put delete', false);
```

### `controller.operators()`

**BYPASSES VALIDATION** Use this method to enable non-default update operators.  The update method can be set using the `Update-Operator` header field.

``` javascript
controller.operators('$push $set', 'foo some.path some.other.path');
controller.operators('$pull', 'another.path');
```

### `controller.fragment()`

This is the fragment to match request URLs agains.  Defaults to the plural name of the model.

``` javascript
controller.fragment('/somewhere');
```

### `controller.emptyCollection()`

This can be used to set what status code & body are returned for requests that yield empty query results.  The default is status code 200 with a JSON body containing an empty array.  Other possible options are 204 No Content and 404 Not Found.

``` javascript
controller.emptyCollection(200);
controller.emptyCollection(204);
controller.emptyCollection(404);
```

### `controller.handleErrors()`

Baucis sets the response status code based on different errors.  By default, it also catches and builds responses for certain errors.  Set this to false to have the controller only set status codes, and not handle errors further.

``` javascript
controller.handleErrors(false);
```


### `controller.versions()`

Versioning is implemented using [semver](http://semver.org).  Supported releases are specified when calling `baucis()`.  The release(s) that a controller belongs to are specified with the `versions` controller option.

``` javascript
baucis.rest('cat').versions('0.0.1');
baucis.rest('cat').versions('>0.0.1 <1.0.0');
baucis.rest('cat').versions('~1');
baucis.rest('cat').versions('>2.0.0');
const api = baucis();
baucis().release('0.0.2').release('1.0.0').release('1.1.0').release('2.0.0')
app.use('/api', api);
```

Later, make requests and set the `API-Version` header to a [semver](http://semver.org) range, such as `~1`, `>2 <3`, `*`, etc.  Baucis will use the highest release number that satisfies the range.  If no `API-Version` is specified in a request, the highest release will be used.
