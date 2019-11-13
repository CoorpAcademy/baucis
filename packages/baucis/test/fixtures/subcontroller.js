const mongoose = require('mongoose');
const express = require('express');
const baucis = require('../..')(mongoose, express);
const config = require('./config');

let app;
let server;
const {Schema} = mongoose;

const User = new Schema({
  name: String,
  tasks: [{type: Schema.Types.ObjectId, ref: 'task'}]
});
const Task = new Schema({
  name: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

mongoose.model('user', User);
mongoose.model('task', Task);

module.exports = {
  init(done) {
    mongoose.connect(config.mongo.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
    const users = baucis.rest('user');
    const tasks = users.vivify('tasks');

    tasks.request(function(request, response, next) {
      request.baucis.outgoing(function(context, callback) {
        context.doc.name = 'Changed by Middleware';
        callback(null, context);
      });
      next();
    });

    tasks.query(function(request, response, next) {
      request.baucis.query.where('user', request.params._id);
      next();
    });

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
    // clear all first
    mongoose.model('user').remove({}, function(error) {
      if (error) return done(error);

      mongoose.model('task').remove({}, function(error) {
        if (error) return done(error);

        mongoose.model('user').create(
          ['Alice', 'Bob'].map(function(name) {
            return {name};
          }),
          function(error, alice) {
            if (error) return done(error);

            mongoose.model('task').create(
              ['Mow the Lawn', 'Make the Bed', 'Darn the Socks'].map(function(name) {
                return {name};
              }),
              function(error, task) {
                if (error) return done(error);
                task.user = alice._id;
                task.save(done);
              }
            );
          }
        );
      });
    });
  }
};
