// __Dependencies__
const mongoose = require('mongoose');
const express = require('express');
const baucis = require('@coorpacademy/baucis');
require('..');

const config = {mongo: {url: 'mongodb://127.0.0.1/legumes'}};

// __Private Module Members__
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

mongoose.connect(config.mongo.url);

const controller = baucis
  .rest('vegetable')
  .hints(true)
  .comments(true);

controller.generateSwagger();
controller.swagger.lambic = 'kriek';

baucis.rest('fungus').select('-hyphenated-field-name -password');
baucis.rest('goose');

const app = express();
app.use('/api', baucis());

app.use(function(error, request, response, next) {
  if (error) return response.send(500, error.toString());
  next();
});

app.listen(4312, () => console.log(`go to http://localhost:4312/api/documentation`));

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
const _Vegetable = mongoose.model('vegetable');
const vegetables = vegetableNames.map(function(name) {
  return new _Vegetable({name});
});
vegetables.map(function(vegetable) {
  return vegetable.save.bind(vegetable);
});
