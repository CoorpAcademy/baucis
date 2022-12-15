const mongoose = require('mongoose');
const express = require('express');
const baucis = require('../..')(mongoose, express);
const config = require('./config');

let app;
let server;
const Schema = mongoose.Schema;
const Party = new Schema({hobbits: Number, dwarves: Number});
const Dungeon = new Schema({treasures: Number});
const Pumpkin = new Schema({title: String});

mongoose.model('party', Party);
mongoose.model('dungeon', Dungeon);
mongoose.model('pumpkin', Pumpkin).locking(true);

module.exports = {
  init(done) {
    mongoose.set('strictQuery', true);
    mongoose.connect(config.mongo.url);

    app = express();

    baucis.rest('pumpkin');
    baucis.rest('party').versions('1.x');
    baucis.rest('party').versions('2.1.0');
    baucis.rest('party').versions('~3');

    app.use(
      '/api/versioned',
      baucis()
        .releases('1.0.0')
        .releases('2.1.0')
        .releases('3.0.1')
    );

    baucis.rest('dungeon');

    app.use('/api/unversioned', baucis());

    server = app.listen(8012);

    done();
  },
  deinit(done) {
    mongoose.disconnect(function() {
      server.close();
      done();
    });
  }
};
