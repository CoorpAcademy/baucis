// __Dependencies__
const mongoose = require('mongoose');
const express = require('express');
const async = require('async');
const baucis = require('@coorpacademy/baucis');
require('../..');
const config = require('./config');

// __Private Module Members__
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
  stuffed: [Stuffing]
});

mongoose.model('vegetable', Vegetable);
mongoose.model('fungus', Fungus).plural('fungi');
mongoose.model('goose', Goose).plural('geese');

// __Module Definition__
const fixture = {
  init(done) {
    mongoose.connect(config.mongo.url);

    fixture.controller = baucis
      .rest('vegetable')
      .hints(true)
      .comments(true);

    fixture.controller.generateSwagger();
    fixture.controller.swagger.lambic = 'kriek';

    baucis.rest('fungus').select('-hyphenated-field-name -password');
    baucis.rest('goose');

    app = express();
    app.use('/api', baucis());

    app.use(function(error, request, response, next) {
      if (error) return response.send(500, error.toString());
      next();
    });

    server = app.listen(8012);
    done();
  },
  deinit(done) {
    server.close();
    mongoose.disconnect();
    done();
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
    let deferred = [Vegetable.remove.bind(Vegetable)];

    deferred = deferred.concat(
      vegetables.map(function(vegetable) {
        return vegetable.save.bind(vegetable);
      })
    );

    async.series(deferred, done);
  }
};
module.exports = fixture;
