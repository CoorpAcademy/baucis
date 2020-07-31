// __Dependencies__
const mongoose = require('mongoose');
const express = require('express');
const async = require('async');
const baucis = require('@coorpacademy/baucis')(mongoose, express);
const plugin = require('../..');
const config = require('./config');

baucis.addPlugin(plugin);

let app;
let server;
const Schema = mongoose.Schema;
const Vegetable = new Schema({
  name: {type: String, required: true},
  diseases: {type: [String], select: false},
  species: {type: String, default: 'n/a', select: false},
  related: {type: Schema.ObjectId, ref: 'vegetable'}
});
const Fungus = new Schema({
  dork: {type: Boolean, default: true},
  'hyphenated-field-name': {type: String, default: 'blee'},
  password: {type: String, default: '123'}
});
const Stuffing = new Schema({
  bread: {type: Boolean, default: true}
});
const Goose = new Schema({
  cooked: {type: Boolean, default: true},
  taste: Schema.Types.Mixed,
  stuffed: [Stuffing]
});

const ChargeArea = new Schema({
  name: {type: String, required: true},
  tags: {type: [String], required: false},
  orders: {type: [Number], required: false},
  clusters: [{type: Schema.Types.ObjectId, ref: 'ChargeCluster'}]
});
const ChargeCluster = new Schema({
  name: {type: String, required: true}
});

mongoose.model('vegetable', Vegetable);
mongoose.model('fungus', Fungus).plural('fungi');
mongoose.model('goose', Goose).plural('geese');

mongoose.model('chargeCluster', ChargeCluster);
mongoose.model('chargeArea', ChargeArea);

const fixture = {
  init(done) {
    mongoose.connect(config.mongo.url, {useNewUrlParser: true, useUnifiedTopology: true});

    fixture.controller = baucis
      .rest('vegetable')
      .hints(true)
      .comments(true);
    fixture.controller.generateSwagger2();

    // forbiden extension
    fixture.controller.swagger2.lambic = 'kriek';
    // allowed on extensions points for controllers (paths & defintions)
    fixture.controller.swagger2.paths['/starkTrek'] = {
      get: {
        operationId: 'enterprise',
        responses: {
          '200': {
            description: 'Sucessful response.',
            schema: {
              $ref: '#/definitions/Vegetable'
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

    const baucisInstance = baucis();

    // extend root document for Swagger 2 (neeeds access to baucisInstance to access api extensibility)
    baucisInstance.generateSwagger2();
    baucisInstance.swagger2Document.host = 'api.acme.com:8012';
    baucisInstance.swagger2Document['x-powered-by'] = 'baucis';

    baucisInstance.swagger2Document.definitions.customDefinition = {
      properties: {
        a: {
          type: 'string'
        }
      }
    };

    app.use('/api', baucisInstance);

    app.use(function(error, request, response, next) {
      if (error) return response.status(500).send(error.toString());
      next();
    });

    server = app.listen(8012);
    done();
  },
  deinit(done) {
    mongoose.disconnect(function() {
      server.close();
      done();
    });
  },
  create(done) {
    const Vegetable = mongoose.model('vegetable');
    const vegetableNames = [
      'Turnip',
      'Spinach',
      'Pea',
      'Shitake',
      'Lima Bean',
      'Carrot',
      'Zucchini',
      'Radicchio'
    ];
    const vegetables = vegetableNames.map(function(name) {
      return new Vegetable({name});
    });
    let deferred = [Vegetable.deleteMany.bind(Vegetable)];

    deferred = deferred.concat(
      vegetables.map(function(vegetable) {
        return vegetable.save.bind(vegetable);
      })
    );

    async.series(deferred, done);
  }
};
module.exports = fixture;
