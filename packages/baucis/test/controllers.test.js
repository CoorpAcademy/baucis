const {expect} = require('chai');
const mongoose = require('mongoose');
const express = require('express');
const request = require('request-promise').defaults({json: true});
const fixtures = require('./fixtures');
const baucis = require('..')(mongoose, express);

describe('Controllers', function() {
  before(fixtures.controller.init);
  beforeEach(fixtures.controller.create);
  after(fixtures.controller.deinit);

  it('should allow passing string name to create', function() {
    const makeController = function() {
      baucis.Controller('unmade');
    };
    makeController();
    expect(makeController).to.not.throw();
  });

  it('should allow passing a model to create', function() {
    const makeController = function() {
      baucis.Controller(mongoose.model('unmade'));
    };
    expect(makeController).to.not.throw();
  });

  it('should not allow leaving off arguments to create', function() {
    const makeController = function() {
      baucis.Controller();
    };
    expect(makeController).to.throw(/You must pass in a model or model name [(]500[)][.]/);
  });

  it('should not allow weird arguments to create', function() {
    const makeController = function() {
      baucis.Controller({});
    };
    expect(makeController).to.throw(/You must pass in a model or model name [(]500[)][.]/);
  });

  it('should have methods set by default', function() {
    let controller;
    const makeController = function() {
      controller = baucis.Controller('unmade');
    };
    makeController();
    expect(makeController).to.not.throw();
    expect(controller.methods()).to.eql(['head', 'get', 'put', 'post', 'delete']);
  });

  it('should support select options for GET requests', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/cheeses',
      qs: {sort: 'name'}
    });
    expect(body).to.have.property('length', 3);
    expect(body[1]).to.have.property('color', 'Yellow');
    expect(body[1]).to.have.property('name', 'Cheddar');
    expect(body[1]).not.to.have.property('_id');
    expect(body[1]).not.to.have.property('cave');
  });

  it('should allow deselecting', async function() {
    const body = await request('http://localhost:8012/api/liens');
    expect(body[0]).to.have.property('_id');
    expect(body[0]).to.have.property('__v');
    expect(body[0]).not.to.have.property('title');
  });

  it('should allow deselecting hyphenated field names', async function() {
    const body = await request('http://localhost:8012/api/stores');
    expect(body[0]).to.have.property('_id');
    expect(body[0]).to.have.property('__v');
    expect(body[0]).not.to.have.property('hpyhenated-field-name');
    expect(body[0]).not.to.have.property('voltaic');
  });

  it('should support select options for POST requests', async function() {
    const body = await request({
      method: 'POST',
      url: 'http://localhost:8012/api/cheeses',
      body: {name: 'Gorgonzola', color: 'Green'}
    });
    expect(body).to.have.property('color', 'Green');
    expect(body).to.have.property('name', 'Gorgonzola');
    expect(body).not.to.have.property('_id');
    expect(body).not.to.have.property('cave');
  });

  it('should support select options for PUT requests', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/cheeses/Cheddar',
      method: 'PUT',
      body: {color: 'White'}
    });
    expect(body).to.have.property('color', 'White');
    expect(body).to.have.property('name', 'Cheddar');
    expect(body).not.to.have.property('_id');
    expect(body).not.to.have.property('cave');
  });

  it('should allow POSTing when fields are deselected (issue #67)', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/stores',
      body: {name: "Lou's"},
      method: 'POST'
    });
    expect(body).to.have.property('_id');
    expect(body).to.have.property('__v');
    expect(body).to.have.property('name', "Lou's");
  });

  it('should support finding documents with custom findBy field', async function() {
    const body = await request('http://localhost:8012/api/cheeses/Camembert');
    expect(body).to.have.property('color', 'White');
  });

  it('should disallow adding a non-unique findBy field', function() {
    const makeController = function() {
      baucis.Controller('cheese').findBy('color');
    };
    expect(makeController).to.throw(
      /^`findBy` path for model "cheese" must be unique [(]500[)][.]$/
    );
  });

  it('should allow adding a uniqe findBy field 1', function() {
    const makeController = function() {
      const rab = new mongoose.Schema({arb: {type: String, unique: true}});
      mongoose.model('rab', rab);
      baucis.Controller('rab').findBy('arb');
    };
    expect(makeController).not.to.throw();
  });

  it('should allow adding a unique findBy field 2', function() {
    const makeController = function() {
      const barb = new mongoose.Schema({arb: {type: String, index: {unique: true}}});
      mongoose.model('barb', barb);
      baucis.Controller('barb').findBy('arb');
    };
    expect(makeController).not.to.throw();
  });

  it('should allow adding arbitrary routes', async function() {
    const body = await request('http://localhost:8012/api/stores/info');
    expect(body).to.equal('OK!');
  });

  it('should allow adding arbitrary routes with params', async function() {
    const body = await request('http://localhost:8012/api/stores/XYZ/arbitrary');
    expect(body).to.equal('XYZ');
  });

  it('should still allow using baucis routes when adding arbitrary routes', async function() {
    const options = {
      url: 'http://localhost:8012/api/stores',
      qs: {select: '-_id -__v', sort: 'name'}
    };
    const body = await request(options);
    expect(body).to.eql([{name: 'Corner'}, {name: 'Westlake'}]);
  });

  it('should allow using middleware', async function() {
    const {statusCode, headers} = await request({
      url: 'http://localhost:8012/api/stores',
      resolveWithFullResponse: true,
      method: 'DELETE'
    });
    expect(statusCode).to.equal(200);
    expect(headers['x-poncho']).to.equal('Poncho!');
  });

  it('should allow using middleware mounted at a path', async function() {
    const body = await request({
      url: 'http://localhost:8012/api/stores/binfo',
      method: 'POST'
    });
    expect(body).to.equal('Poncho!');
  });

  it('should disallow unrecognized verbs', function() {
    const controller = baucis.Controller('store');
    const register = function() {
      controller.request('get dude', function() {});
    };
    expect(register).to.throw(/^Unrecognized HTTP method: "dude" [(]500[)][.]$/);
  });

  it('should disallow unrecognized howManys', function() {
    const controller = baucis.Controller('store');
    const register = function() {
      controller.request('gargoyle', 'get put', function() {});
    };
    expect(register).to.throw(
      /^End-point type must be either "instance" or "collection," not "gargoyle" [(]500[)][.]$/
    );
  });

  it('should allow specifying instance or collection middleware', function() {
    const controller = baucis.Controller('store');
    const register = function() {
      controller.request('collection', 'get put head delete post', function() {});
      controller.request('instance', 'get put head delete post', function() {});
    };
    expect(register).to.not.throw();
  });

  it('should allow registering query middleware for other verbs', function() {
    const controller = baucis.Controller('store');
    const register = function() {
      controller.query('get put head delete', function() {});
    };
    expect(register).not.to.throw();
  });

  it('should allow registering POST middleware for other stages', function() {
    const controller = baucis.Controller('store');
    const register = function() {
      controller.request('post', function() {});
      controller.query('post', function() {});
    };

    expect(register).not.to.throw();
  });

  it('should correctly set the deselected paths property', function() {
    const doozle = new mongoose.Schema({
      a: {type: String, select: false},
      b: String,
      c: String,
      d: String
    });
    mongoose.model('doozle', doozle);
    const controller = baucis.Controller('doozle').select('-d c -a b');
    expect(controller.deselected()).eql(['a', 'd']);
  });

  it('should disallow push mode by default', async function() {
    const {body, statusCode} = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/stores/Westlake',
      headers: {'Update-Operator': '$push'},
      body: {molds: 'penicillium roqueforti', __v: 0},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(403);
    expect(body).to.have.property(
      'message',
      'The requested update operator "$push" is not enabled for this resource (403).'
    );
  });

  it('should disallow pushing to non-whitelisted paths', async function() {
    const {statusCode, body} = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: {'Update-Operator': '$push'},
      body: {'favorite nes game': 'bubble bobble'},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(403);
    expect(body).to.have.property(
      'message',
      'This update path is forbidden for the requested update operator "$push" (403).'
    );
  });

  it("should allow pushing to an instance document's whitelisted arrays when $push mode is enabled", async function() {
    const body = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Huntsman?select=molds',
      headers: {'Update-Operator': '$push'},
      body: {molds: 'penicillium roqueforti'}
    });

    expect(body).to.have.property('molds');
    expect(body.molds).to.have.property('length', 1);
    expect(body.molds).to.eql(['penicillium roqueforti']);
  });

  it('should disallow $pull mode by default', async function() {
    const {statusCode, body} = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/stores/Westlake',
      headers: {'Update-Operator': '$pull'},
      body: {molds: 'penicillium roqueforti', __v: 0},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(403);
    expect(body).to.have.property(
      'message',
      'The requested update operator "$pull" is not enabled for this resource (403).'
    );
  });

  it('should disallow pulling non-whitelisted paths', async function() {
    const {body, statusCode} = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: {'Update-Operator': '$pull'},
      body: {'favorite nes game': 'bubble bobble'},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(403);
    expect(body).to.have.property(
      'message',
      'This update path is forbidden for the requested update operator "$pull" (403).'
    );
  });

  it("should allow pulling from an instance document's whitelisted arrays when $pull mode is enabled", async function() {
    const body = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Huntsman?select=molds',
      headers: {'Update-Operator': '$push'},
      body: {molds: 'penicillium roqueforti'}
    });
    expect(body).to.have.property('molds');
    expect(body.molds).to.have.property('length', 1);
    expect(body.molds).to.eql(['penicillium roqueforti']);

    const bodyput = await request({
      url: 'http://localhost:8012/api/cheeses/Huntsman?select=molds',
      headers: {'Update-Operator': '$pull'},
      body: {molds: 'penicillium roqueforti'},
      method: 'PUT'
    });
    expect(bodyput).to.have.property('molds');
    expect(bodyput.molds).to.have.property('length', 0);
  });

  it('should disallow push mode by default', async function() {
    const {statusCode, body} = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/stores/Westlake',
      headers: {'Update-Operator': '$set'},
      body: {molds: 'penicillium roqueforti', __v: 0},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(403);
    expect(body).to.have.property(
      'message',
      'The requested update operator "$set" is not enabled for this resource (403).'
    );
  });

  it('should disallow setting non-whitelisted paths', async function() {
    const {body, statusCode} = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: {'Update-Operator': '$set'},
      body: {'favorite nes game': 'bubble bobble'},
      resolveWithFullResponse: true,
      simple: false
    });
    expect(statusCode).to.equal(403);
    expect(body).to.have.property(
      'message',
      'This update path is forbidden for the requested update operator "$set" (403).'
    );
  });

  it("should allow setting an instance document's whitelisted paths when $set mode is enabled", async function() {
    const body = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Huntsman?select=molds',
      headers: {'Update-Operator': '$set'},
      body: {molds: ['penicillium roqueforti']}
    });

    expect(body).to.have.property('molds');
    expect(body.molds).to.have.property('length', 1);
    expect(body.molds).to.eql(['penicillium roqueforti']);
  });

  it('should allow pushing to embedded arrays using positional $', async function() {
    const body = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Camembert?select=arbitrary',
      headers: {'Update-Operator': '$push'},
      qs: {conditions: JSON.stringify({'arbitrary.goat': true})},
      body: {'arbitrary.$.llama': 5}
    });

    expect(body).to.have.property('arbitrary');
    expect(body.arbitrary).to.have.property('length', 2);
    expect(body.arbitrary[0]).to.have.property('llama');
    expect(body.arbitrary[0].llama).to.have.property('length', 3);
    expect(body.arbitrary[0].llama[0]).to.equal(3);
    expect(body.arbitrary[0].llama[1]).to.equal(4);
    expect(body.arbitrary[0].llama[2]).to.equal(5);
    expect(body.arbitrary[1].llama).to.have.property('length', 2);
    expect(body.arbitrary[1].llama[0]).to.equal(1);
    expect(body.arbitrary[1].llama[1]).to.equal(2);
  });

  it('should allow setting embedded fields using positional $', async function() {
    const body = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Camembert?select=arbitrary',
      headers: {'Update-Operator': '$set'},
      qs: {conditions: JSON.stringify({'arbitrary.goat': false})},
      body: {'arbitrary.$.champagne': 'extra dry'}
    });

    expect(body).to.have.property('arbitrary');
    expect(body.arbitrary).to.have.property('length', 2);
    expect(body.arbitrary[0]).not.to.have.property('champagne');
    expect(body.arbitrary[1]).to.have.property('champagne', 'extra dry');
  });

  it('should allow pulling from embedded fields using positional $', async function() {
    const body = await request({
      method: 'PUT',
      url: 'http://localhost:8012/api/cheeses/Camembert?select=arbitrary',
      headers: {'Update-Operator': '$pull'},
      qs: {conditions: JSON.stringify({'arbitrary.goat': true})},
      body: {'arbitrary.$.llama': 3}
    });

    expect(body).to.have.property('arbitrary');
    expect(body.arbitrary).to.have.property('length', 2);
    expect(body.arbitrary[0]).to.have.property('llama');
    expect(body.arbitrary[0].llama).to.have.property('length', 1);
    expect(body.arbitrary[0].llama[0]).to.equal(4);
    expect(body.arbitrary[1].llama).to.have.property('length', 2);
    expect(body.arbitrary[1].llama[0]).to.equal(1);
    expect(body.arbitrary[1].llama[1]).to.equal(2);
  });

  it('should send 405 when a verb is disabled (GET)', async function() {
    const {headers, body, statusCode} = await request({
      uri: 'http://localhost:8012/api/beans',
      simple: false,
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(405);
    expect(headers).to.have.property('allow', 'HEAD,POST,PUT,DELETE');
    expect(body).to.have.property(
      'message',
      'The requested method has been disabled for this resource (405).'
    );
  });

  it('should send 405 when a verb is disabled (DELETE)', async function() {
    const {headers, body, statusCode} = await request({
      uri: 'http://localhost:8012/api/liens',
      simple: false,
      resolveWithFullResponse: true,
      method: 'DELETE'
    });
    expect(statusCode).to.equal(405);
    expect(headers).to.have.property('allow', 'HEAD,GET,POST,PUT');
    expect(body).to.have.property(
      'message',
      'The requested method has been disabled for this resource (405).'
    );
  });

  it('should return a 400 when ID malformed (not ObjectID)', async function() {
    const {statusCode, body} = await request({
      uri: 'http://localhost:8012/api/beans/bad',
      simple: false,
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(400);
    expect(body).to.have.property(
      'message',
      'The requested document ID "bad" is not a valid document ID (400).'
    );
  });

  it('should return a 400 when ID malformed (not Number)', async function() {
    const {statusCode, body} = await request({
      uri: 'http://localhost:8012/api/deans/0booze',
      simple: false,
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(400);
    expect(body).to.have.property(
      'message',
      'The requested document ID "0booze" is not a valid document ID (400).'
    );
  });

  it('should allow setting path different from model name', async function() {
    const options = {
      url: 'http://localhost:8012/api/baloo/?sort=name'
    };
    const body = await request(options);
    expect(body).to.have.length(2);
  });

  it('should allow setting model independently of name', async function() {
    const options = {
      url: 'http://localhost:8012/api/timeentries/Camembert'
    };
    const body = await request(options);
    expect(body).to.have.property('color', 'White');
  });

  it('should handle unique key error as a validation error', async function() {
    await request({
      url: 'http://localhost:8012/api/cheeses',
      body: {name: 'Gorgonzola', color: 'Green'},
      method: 'POST'
    });
    const {statusCode, body} = await request({
      url: 'http://localhost:8012/api/cheeses',
      body: {name: 'Gorgonzola', color: 'Green'},
      method: 'POST',
      simple: false,
      resolveWithFullResponse: true
    });
    expect(statusCode).to.equal(422);
    expect(body).to.have.length(1);
    expect(body[0]).to.have.property('name');
    expect(body[0]).to.have.property('message', 'Path `name` (Gorgonzola) must be unique.');
    expect(body[0]).to.have.property('path', 'name');
    expect(body[0]).to.have.property('originalMessage');
    expect(body[0].originalMessage).to.match(/E11000 duplicate key/);
    expect(body[0].originalMessage).to.match(/dup key/);
    expect(body[0].originalMessage).to.match(/yYyBaUcIsTeStYyY[.]cheeses([.][$]| index: )name_1/);
    expect(body[0]).to.have.property('name', 'MongoError');
    expect(body[0]).to.have.property('path', 'name');
    expect(body[0]).to.have.property('type', 'unique');
    expect(body[0]).to.have.property('value', 'Gorgonzola');
  });

  it('should not handle errors if disabled', async function() {
    await request({
      url: 'http://localhost:8012/api-no-error-handler/geese',
      body: {name: 'Gorgonzola', color: 'Green'},
      method: 'POST'
    });
    const {statusCode, body} = await request({
      url: 'http://localhost:8012/api-no-error-handler/geese',
      body: {name: 'Gorgonzola', color: 'Green'},
      method: 'POST',
      simple: false,
      resolveWithFullResponse: true
    });

    expect(statusCode).to.equal(422);
    expect(body).to.be.a('string');
    expect(body).to.contain(
      'Unprocessable Entity: The request entity could not be processed (422)'
    );
  });

  it('should allow setting path apart from plural', async function() {
    const body = await request('http://localhost:8012/api/linseed.oil');
    expect(body).to.have.property('length', 2);
  });
});
