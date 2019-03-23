// __Dependencies__
var mongoose = require('mongoose');
var express = require('express');
var async = require('async');
var baucis = require('baucis');
var config = require('./config');
var plugin = require('../..');

// __Private Module Members__
var app;
var server;
var Schema = mongoose.Schema;
var Vegetable = new Schema({
  name: { type: String, required: true },
  diseases: { type: [ String ], select: false },
  species: { type: String, default: 'n/a', select: false },
  related: { type: Schema.ObjectId, ref: 'vegetable' }
});
var Fungus = new Schema({
  dork: {type: Boolean, default: true },
  'hyphenated-field-name': { type: String, default: 'blee' },
  password: {type: String, default: '123' }
});
var Stuffing = new Schema({
  bread: {type: Boolean, default: true }
});
var Goose = new Schema({
  cooked: {type: Boolean, default: true },
  stuffed: [Stuffing]
});

var ChargeArea = new Schema({
  name: { type: String, required: true },
  tags: { type: [String], required: false },
  orders: { type: [Number], required: false },
  clusters: [ { type: Schema.Types.ObjectId, ref: 'ChargeCluster' } ]
});
var ChargeCluster = new Schema({
  name: { type: String, required: true }
});

mongoose.model('vegetable', Vegetable);
mongoose.model('fungus', Fungus).plural('fungi');
mongoose.model('goose', Goose).plural('geese');

mongoose.model('chargeCluster', ChargeCluster);
mongoose.model('chargeArea', ChargeArea);

// __Module Definition__
var fixture = module.exports = {
  init: function (done) {
    mongoose.connect(config.mongo.url);

    fixture.controller = baucis.rest('vegetable').hints(true).comments(true);
    fixture.controller.generateSwagger2();

    //forbiden extension
    fixture.controller.swagger2.lambic = 'kriek';
    //allowed on extensions points for controllers (paths & defintions)
    fixture.controller.swagger2.paths['/starkTrek'] = {
		get: {
			operationId: 'enterprise',
			responses: {
				"200": {
					"description": "Sucessful response.",
					"schema": {
						"$ref": "#/definitions/Vegetable"
					}
				}
			}
		}
	};
    fixture.controller.swagger2.definitions.Spook = {};
    
    baucis.rest('fungus').select('-hyphenated-field-name -password');
    baucis.rest('goose');
	baucis.rest('chargeArea');
	baucis.rest('chargeCluster');
	
    app = express();

    var baucisInstance = baucis(); 

    //extend root document for Swagger 2 (neeeds access to baucisInstance to access api extensibility)
    baucisInstance.generateSwagger2();
    baucisInstance.swagger2Document.host = 'api.acme.com:8012';
    baucisInstance.swagger2Document['x-powered-by'] = 'baucis';

	baucisInstance.swagger2Document.definitions.customDefinition = {
		properties: {
			a: {
				type: "string"
			}
		}
	};
	
    app.use('/api', baucisInstance);

    app.use(function (error, request, response, next) {
      if (error) return response.status(500).send(error.toString());
      next();
    });

    server = app.listen(8012);
    done();
  },
  deinit: function(done) {
    server.close();
    mongoose.disconnect();
    done();
  },
  create: function (done) {
    var Vegetable = mongoose.model('vegetable');
    var vegetableNames = [ 'Turnip', 'Spinach', 'Pea', 'Shitake', 'Lima Bean', 'Carrot', 'Zucchini', 'Radicchio' ];
    var vegetables = vegetableNames.map(function (name) {
      return new Vegetable({ name: name });
    });
    var deferred = [
      Vegetable.remove.bind(Vegetable)
    ];

    deferred = deferred.concat(vegetables.map(function (vegetable) {
      return vegetable.save.bind(vegetable);
    }));

    async.series(deferred, done);
  }
};
