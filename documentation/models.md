## Models :man_artist:

Baucis decorates Mongoose models with a few additional methods to add richer textual and other semantics.  The Model API is *unstable*.  It will be stablized for v1.0.0 (in original baucis). (*not sure this happened*)

Typically, these methods would be called when the schema is registered with Mongoose:
``` javascript
mongoose.model('cactus', Cactus).plural('cacti');
mongoose.model('hen', Hen).locking(true);
```


### `model.singular()`

Customize the name used for singular instances of documents associated with this model.
``` javascript
model.singular('cactus');
```


### `model.plural()`

Customize the name used for groups of documents associated with this model.  Defaults to the plural of the model's singular name.  Uses Mongoose's pluralizer utility method.
``` javascript
model.plural('cacti');
```


### `model.lastModified()`

Set the `Last-Modified` HTTP header using the given `Date` field.  Disabled by default.
``` javascript
model.lastModified('modified.date');
```


### `model.locking()`

Enable optimistic locking.  (Disabled by default.)  Requires that all PUTs must send the document version (`__v` by default) and will send a 409 response if there would be a version conflict, instead of performing the update.

``` javascript
model.locking(true);
```
