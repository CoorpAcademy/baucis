## Swagger :world_map:

Swagger/OpenAPI doc cn be generated thanks to plugins.
Depending on your 'flavor', you can use the appropriate instructions

- [Swagger 1](#swagger-1)
- [Swagger 2](#swagger-2)
- [OpenApi 3](#open-api-3)

### Open Api 3
Refer to the documentation of the plugin [:link: `@coorpacademy/baucis-openapi3`](../packages/baucis-openapi3)

### Swagger 2
Refer to the documentation of the plugin [:link: `@coorpacademy/baucis-swagger2`](../packages/baucis-swagger2)

### Swagger 1
Here's how to use swagger.  First, install the plugin:

    npm install --save @coorpacademy/baucis-swagger

Next, download the [swagger-ui](https://github.com/wordnik/swagger-ui) client.

    git clone git@github.com:wordnik/swagger-ui.git
    open swagger-ui/dist/index.html

Then, create your API as normal, but be sure to require `baucis-swagger`.

``` javascript
var baucis = require('baucis');
var swagger = require('baucis-swagger');
app.use('/api', baucis());
```

Point the swagger client at your API:

    http://localhost:8012/api/documentation

Now you have documentation and a test client!

To customize the swagger definition, simply alter the controler's swagger data directly:

``` javascript
const controller = baucis.rest('sauce');

controller.generateSwagger();

controller.swagger.apis.push({
  'path': '/sauces/awesome',
  'description': 'Awesome sauce.',
  'operations': [
    {
      'httpMethod': 'GET',
      'nickname': 'getAwesomeSauce',
      'responseClass': 'Sauce',
      'summary': 'Carolina BBQ Sauce.'
    }
  ]
});
```
