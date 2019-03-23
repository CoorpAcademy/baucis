It’s possible to do something like this (off the top of my head, untested):

```javascript
// Create mongoose instances connected to different DBs, then:

var controller1 = baucis.Controller(mongoose1.model(‘xyz’));
var controller2 = baucis.Controller(mongoose2.model(‘xyz’));
var controller3 = baucis.Controller(mongoose3.model(‘xyz’));

var app = express();

app.use(function (request, response, next) {
  var chosen = …; // choose correct model from correct DB by custom logic

  chosen(request, response, next);
});
```