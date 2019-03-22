// __Dependencies__
const mongoose = require('mongoose');
const express = require('express');
const deco = require('deco');
const async = require('async');
const baucis = require('../..');
const config = require('./config');

// __Private Module Members__
let app;
let server;

const BaseSchema = deco(function() {
  this.add({name: String});
});

BaseSchema.inherit(mongoose.Schema);

const LiqueurSchema = BaseSchema();
const AmaroSchema = BaseSchema({bitterness: Number});
const CordialSchema = BaseSchema({sweetness: Number});

const Liqueur = mongoose.model('liqueur', LiqueurSchema);
const Amaro = Liqueur.discriminator('amaro', AmaroSchema).plural('amari');
const Cordial = Liqueur.discriminator('cordial', CordialSchema);

module.exports = {
  init(done) {
    mongoose.connect(config.mongo.url, {useNewUrlParser: true});

    baucis.rest(Liqueur);
    baucis.rest(Amaro);

    app = express();
    app.use('/api', baucis());

    server = app.listen(8012);

    done();
  },
  deinit(done) {
    server.close();
    mongoose.disconnect();
    done();
  },
  create(done) {
    const liqueurs = [{name: 'Generic'}];
    const amari = [
      {name: 'Amaro alle Erbe', bitterness: 3},
      {name: 'Campari', bitterness: 5},
      {name: 'Fernet', bitterness: 10}
    ];
    const cordials = [{name: 'Blackberry', sweetness: 5}, {name: 'Peach', sweetness: 7}];
    let deferred = [
      Liqueur.deleteMany.bind(Liqueur),
      Amaro.deleteMany.bind(Amaro),
      Cordial.deleteMany.bind(Cordial)
    ];

    deferred = deferred.concat(
      liqueurs.map(function(data) {
        const liqueur = new Liqueur(data);
        return liqueur.save.bind(liqueur);
      })
    );

    deferred = deferred.concat(
      amari.map(function(data) {
        const amaro = new Amaro(data);
        return amaro.save.bind(amaro);
      })
    );

    deferred = deferred.concat(
      cordials.map(function(data) {
        const cordial = new Cordial(data);
        return cordial.save.bind(cordial);
      })
    );

    async.series(deferred, done);
  }
};
