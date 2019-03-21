const {expect} = require('chai');
const mongoose = require('mongoose');
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const request = require('request').defaults({json: true});
const baucis = require('..');

const fixtures = require('./fixtures');

describe('Headers', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('sets Last-Modified for single documents', function(done) {
    const turnip = vegetables[0];
    const options = {
      url: `http://localhost:8012/api/vegetables/${turnip._id}`
    };
    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('last-modified');
      const modified = response.headers['last-modified'];
      const httpDate = new Date(modified).toUTCString();
      expect(modified).to.equal(httpDate);

      request.get(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(200);
        expect(response.headers).to.have.property('last-modified', httpDate);
        done();
      });
    });
  });

  it('sets Last-Modified for the collection', function(done) {
    const updates = vegetables.map(function(vegetable) {
      return vegetable.lastModified;
    });
    const max = new Date(Math.max.apply(null, updates));
    const httpDate = new Date(max).toUTCString();

    const options = {
      url: 'http://localhost:8012/api/vegetables'
    };

    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('last-modified', httpDate);
      request.get(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(200);
        expect(response.headers.trailer).to.equal('Last-Modified, Etag');
        expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
        expect(response.headers['transfer-encoding']).to.equal('chunked');
        expect(response.trailers).to.have.property('last-modified', httpDate);
        done();
      });
    });
  });

  it('sets Etag for single documents', function(done) {
    const turnip = vegetables[0];
    const options = {
      url: `http://localhost:8012/api/vegetables/${turnip._id}`
    };
    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      const etag = response.headers.etag;
      expect(etag).to.match(/^"[0-9a-z]{32}"$/);
      request.get(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(200);
        expect(response.headers.etag).to.equal(etag);
        done();
      });
    });
  });

  it('sets Etag for the collection', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables'
    };
    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      const etag = response.headers.etag;
      expect(etag).to.match(/^"[0-9a-z]{32}"$/);
      request.get(options, function(error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.equal(200);
        expect(response.headers.trailer).to.equal('Last-Modified, Etag');
        expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
        expect(response.headers['transfer-encoding']).to.equal('chunked');
        expect(response.trailers.etag).to.equal(etag);
        done();
      });
    });
  });

  it('sets Allowed', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables'
    };
    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('allow', 'HEAD,GET,POST,PUT,DELETE');
      done();
    });
  });

  it('sends 406 Not Acceptable when the requested type is not accepted', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      headers: {
        Accept: 'application/xml'
      }
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(406);
      expect(response.headers).to.have.property('content-type', 'text/html; charset=utf-8');
      expect(body).to.contain(
        'Not Acceptable: The requested content type could not be provided (406).'
      );
      done();
    });
  });

  it('should send 415 Unsupported Media Type when the request content type cannot be parsed', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      headers: {
        'Content-Type': 'application/xml'
      }
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(415);
      expect(body).to.have.property('message', "The request's content type is unsupported (415).");
      done();
    });
  });

  it('should match the correct MIME type, ignoring extra options and linear whitespace', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      headers: {
        'Content-Type':
          '     application/json        ;       charset=UTF-8    cheese=roquefort      '
      },
      json: {name: 'Tomatillo'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(201);
      done();
    });
  });

  it('should not set X-Powered-By', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables'
    };
    request.head(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).not.to.have.property('x-powered-by');
      done();
    });
  });
});
