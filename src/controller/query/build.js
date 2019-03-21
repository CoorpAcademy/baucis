// __Module Definition__
const decorator = (module.exports = function() {
  const controller = this;

  controller.query('collection', '*', function(request, response, next) {
    request.baucis.query = controller.model().find(request.baucis.conditions);
    next();
  });

  controller.query('instance', '*', function(request, response, next) {
    request.baucis.query = controller.model().findOne(request.baucis.conditions);
    next();
  });
});
