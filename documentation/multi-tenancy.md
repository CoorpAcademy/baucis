## Multi tenancy :flags:
In theory It’s possible to do something like this, thought it is not really tested.


```javascript
// Create mongoose instances connected to different DBs, then:

const controller1 = baucis.Controller(mongoose1.model(‘xyz’));
const controller2 = baucis.Controller(mongoose2.model(‘xyz’));
const controller3 = baucis.Controller(mongoose3.model(‘xyz’));

const app = express();

app.use(function (request, response, next) {
  var chosen = …; // choose correct model from correct DB by custom logic

  chosen(request, response, next);
});
```