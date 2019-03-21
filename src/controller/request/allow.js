// __Module Definition__
module.exports = function() {
  const controller = this;
  // Build the "Allow" response header
  controller.request(function(request, response, next) {
    const active = ['head', 'get', 'post', 'put', 'delete'].filter(function(method) {
      return controller.methods(method) !== false;
    });
    const allowed = active.map(function(verb) {
      return verb.toUpperCase();
    });
    response.set('Allow', allowed.join());
    next();
  });
};
