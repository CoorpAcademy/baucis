**_This page was started by a supporter of the project and may not reflect the true state or the proper way of doing things. Viewer discretion is advised._**

# Upgrading to 1.0

### - `singular/plural` properties are now part of baucis.model() and not controller.

Now you have to use baucis.model() instead of mongoose.model() and singular/plural properties are now defined on Model instead of Controller.

So if you had something like:

    mongoose.model('model', ModelSchema);
    controller = baucis.rest('model');
    controller.singular('model');
    controller.plural('models');

it have to be something like this:

    var Model = baucis.model('model', ModelSchema);
    Model.singular('model');
    Model.plural('models');


# Upgrading to 0.2.5
### - `documents` stage is deprecated
The new pattern for this stage is:

    controller.request('post put', function (request, response, next) {
      request.baucis.outgoing(function (context, callback) {
        if (!context.doc.ok()) return callback(new Error());
         callback(null, context);
      });
    });

More about this here: https://github.com/wprl/baucis/issues/170

### - the pattern `req.baucis.query.select('+field')` doenst work
is this even a baucis issue? just list all the fields

### - subcontroller ??
this pattern is gone, see _middleware_ in docs

    var controller = baucis.rest('Story');
    c.get('/somepath', function (req, res, next) {
    });

### - disabling methods
controller.methods('post put del', false)
