const mongoose = require('mongoose');
const express = require('express');
const baucis = require('../..')(mongoose, express);
const config = require('./config');

let app;
let server;
const Schema = mongoose.Schema;

const Stores = new Schema({
  name: {type: String, required: true, unique: true},
  mercoledi: Boolean,
  voltaic: {type: Boolean, default: true},
  'hyphenated-field-name': {type: Boolean, default: true}
});

const Cheese = new Schema({
  name: {type: String, required: true, unique: true},
  color: {type: String, required: true, select: false},
  bother: {type: Number, required: true, default: 5},
  molds: [String],
  life: {type: Number, default: 42},
  arbitrary: [
    {
      goat: Boolean,
      champagne: String,
      llama: [Number]
    }
  ]
});

const Beans = new Schema({koji: Boolean});
const Deans = new Schema({room: {type: Number, unique: true}});
const Liens = new Schema({title: {type: String, default: 'Babrius'}});
const Fiends = new Schema({average: Number});
const Unmades = new Schema({mode: Number});

mongoose.model('store', Stores);
mongoose.model('cheese', Cheese);
mongoose.model('bean', Beans);
mongoose.model('dean', Deans);
mongoose.model('lien', Liens);
mongoose.model('fiend', Fiends);
mongoose.model('unmade', Unmades);
mongoose.model('timeentry', Cheese, 'cheeses').plural('timeentries');
mongoose.model('mean', Fiends, 'fiends').locking(true);
mongoose.model('bal', Stores, 'stores').plural('baloo');

module.exports = {
  init(done) {
    mongoose.Promise = global.Promise;
    mongoose.connect(config.mongo.url, {useNewUrlParser: true, useCreateIndex: true});

    // Stores controller
    const stores = baucis
      .rest('store')
      .findBy('name')
      .select('-hyphenated-field-name -voltaic');

    stores.use('/binfo', function(request, response, next) {
      response.json('Poncho!');
    });

    stores.use(function(request, response, next) {
      response.set('X-Poncho', 'Poncho!');
      next();
    });

    stores.get('/info', function(request, response, next) {
      response.json('OK!');
    });

    stores.get('/:id/arbitrary', function(request, response, next) {
      response.json(request.params.id);
    });

    const cheesy = baucis
      .rest('cheese')
      .select('-_id color name')
      .findBy('name');
    cheesy.operators('$push', 'molds arbitrary arbitrary.$.llama');
    cheesy.operators('$set', 'molds arbitrary.$.champagne');
    cheesy.operators('$pull', 'molds arbitrary.$.llama');

    baucis
      .rest('timeentry')
      .findBy('name')
      .select('color');
    baucis.rest('bean').methods('get', false);
    baucis
      .rest('dean')
      .findBy('room')
      .methods('get', false);
    baucis
      .rest('lien')
      .select('-title')
      .methods('delete', false);
    baucis.rest('mean');
    baucis.rest('bal').findBy('name');
    baucis.rest('bal').fragment('linseed.oil');

    app = express();
    app.use('/api', baucis());

    baucis
      .rest('cheese')
      .fragment('geese')
      .handleErrors(false);

    app.use('/api-no-error-handler', baucis());

    server = app.listen(8012);

    done();
  },
  deinit(done) {
    server.close();
    done();
  },
  create(done) {
    // clear all first
    mongoose.model('store').deleteMany({}, function(error) {
      if (error) return done(error);

      mongoose.model('cheese').deleteMany({}, function(error) {
        // create stores and tools
        mongoose.model('store').create(
          ['Westlake', 'Corner'].map(function(name) {
            return {name};
          }),
          function(error, store) {
            if (error) return done(error);

            mongoose.model('lien').create({title: 'Heraclitus'}, function(error, lien) {
              if (error) return done(error);

              const cheeses = [
                {name: 'Cheddar', color: 'Yellow'},
                {name: 'Huntsman', color: 'Yellow, Blue, White'},
                {
                  name: 'Camembert',
                  color: 'White',
                  arbitrary: [{goat: true, llama: [3, 4]}, {goat: false, llama: [1, 2]}]
                }
              ];

              mongoose.model('cheese').create(cheeses, done);
            });
          }
        );
      });
    });
  }
};
