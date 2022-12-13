const mongoose = require('mongoose');
const express = require('express');
const baucis = require('../..')(mongoose, express);
const config = require('./config');

let app;
let server;

// eslint-disable-next-line fp/no-class
class BaseSchema extends mongoose.Schema {
  constructor() {
    super(arguments);
    this.add({name: String});
  }
}

const LiqueurSchema = new BaseSchema();
const AmaroSchema = new BaseSchema({bitterness: Number});
const CordialSchema = new BaseSchema({sweetness: Number});

const Liqueur = mongoose.model('liqueur', LiqueurSchema);
const Amaro = Liqueur.discriminator('amaro', AmaroSchema).plural('amari');
const Cordial = Liqueur.discriminator('cordial', CordialSchema);

module.exports = {
  async init() {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongo.url);
    baucis.rest(Liqueur);
    baucis.rest(Amaro);

    app = express();
    app.use('/api', baucis());

    server = app.listen(8012);
  },
  async deinit() {
    await mongoose.disconnect();
    server.close();
  },
  async create() {
    const liqueurs = [{name: 'Generic'}];
    const amari = [
      {name: 'Amaro alle Erbe', bitterness: 3},
      {name: 'Campari', bitterness: 5},
      {name: 'Fernet', bitterness: 10}
    ];
    const cordials = [{name: 'Blackberry', sweetness: 5}, {name: 'Peach', sweetness: 7}];
    await Promise.all([
      await Liqueur.deleteMany(),
      await Amaro.deleteMany(),
      await Cordial.deleteMany()
    ]);

    await Promise.all(liqueurs.map(data => new Liqueur(data).save()));

    await Promise.all(amari.map(data => new Amaro(data).save()));

    await Promise.all(cordials.map(data => new Cordial(data).save()));
  }
};
