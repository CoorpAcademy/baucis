const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const swagger = require('../packages/baucis-swagger');
const baucis = require('../packages/baucis')(mongoose, express);
const swagger2 = require('../packages/baucis-swagger2');
const openapi3 = require('../packages/baucis-openapi3');

baucis.addPlugin(swagger, swagger2, openapi3);

const config = {mongo: {url: 'mongodb://127.0.0.1/legumes'}};

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

mongoose.connect(config.mongo.url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});

const controller = baucis
  .rest('vegetable')
  .hints(true)
  .comments(true);

controller.generateSwagger();
controller.generateSwagger2();
controller.generateOpenApi3();
controller.swagger.lambic = 'kriek';

baucis.rest('fungus').select('-hyphenated-field-name -password');
baucis.rest('goose');

const app = express();
app.use('/api', baucis.get());

app.use('/explorer', express.static(path.join(__dirname, 'explorer')));
app.use(function(error, request, response, next) {
  if (error) return response.send(500, error.toString());
  next();
});

app.listen(4312, () => console.log(`go to http://localhost:4312/explorer`));

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
