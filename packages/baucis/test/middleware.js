const {expect} = require('chai');
const request = require('request');

const fixtures = require('./fixtures');

describe('Middleware', function() {
  let vegetables;
  before(fixtures.vegetable.init);
  beforeEach(async () => {
    vegetables = await fixtures.vegetable.create();
  });
  after(fixtures.vegetable.deinit);

  it('should prevent resource from being loaded when block is set', function(done) {
    const options = {
      url: `http://localhost:8012/api/vegetables/${vegetables[0]._id}`,
      qs: {block: true},
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(401);
      done();
    });
  });

  it('should allow resource to be loaded when block is not set', function(done) {
    const options = {
      url: `http://localhost:8012/api/vegetables/${vegetables[0]._id}`,
      qs: {block: false},
      json: true
    };

    request.get(options, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('name', 'Turnip');

      done();
    });
  });

  it('should allow query middleware to alter query', function(done) {
    const options = {
      url: `http://localhost:8012/api/vegetables/${vegetables[0]._id}`,
      qs: {testQuery: true},
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('_id');
      expect(body).not.to.have.property('name');
      done();
    });
  });

  it('should allow custom stream handlers (IN/POST)', function(done) {
    // should set all fields to a string
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {streamIn: true},
      json: {name: 'zoom'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(201);
      expect(body).to.have.property('_id');
      expect(body).to.have.property('name', 'boom');
      done();
    });
  });

  it('should allow custom stream handlers (IN/PUT)', function(done) {
    // should set all fields to a string
    const radicchio = vegetables[7];
    const options = {
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      qs: {streamIn: true},
      json: {name: 'zoom'}
    };
    request.put(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('_id', radicchio._id.toString());
      expect(body).to.have.property('name', 'boom');
      done();
    });
  });

  it('should allow custom stream handlers (FUNCTION)', function(done) {
    // should set all fields to a string
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {streamInFunction: true},
      json: {name: 'zoom'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(201);
      expect(body).to.have.property('_id');
      expect(body).to.have.property('name', 'bimm');
      done();
    });
  });

  it('should handle errors in user streams (IN/POST)', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {failIt: true},
      json: {name: 'zoom'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Bento box (403).');
      done();
    });
  });

  it('should handle errors in user streams (IN/PUT)', function(done) {
    // should set all fields to a string
    const radicchio = vegetables[7];
    const options = {
      url: `http://localhost:8012/api/vegetables/${radicchio._id}`,
      qs: {failIt: true},
      json: {name: 'zoom'}
    };
    request.put(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Bento box (403).');
      done();
    });
  });

  it('should handle errors in user streams (FUNCTION)', function(done) {
    // should set all fields to a string
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {failItFunction: true},
      json: {name: 'zoom'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Bento box (403).');
      done();
    });
  });

  it('should handle errors in user streams (OUT)', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {failIt2: true},
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Bento box (403).');
      done();
    });
  });

  it('should skip streaming documents in if request.body is already present', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {parse: true},
      json: {name: 'zoom'}
    };
    request.post(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(201);
      expect(body).to.have.property('_id');
      expect(body).to.have.property('name', 'zoom');
      done();
    });
  });

  it('should allow custom stream handlers (OUT)', function(done) {
    // should set all fields to a string
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {streamOut: true},
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 8);
      expect(body[0]).to.have.property('name', 'beam');
      expect(body[1]).to.have.property('name', 'beam');
      expect(body[2]).to.have.property('name', 'beam');
      done();
    });
  });

  it('allows custom stream handlers to alter documents (delete)', function(done) {
    // should set all fields to a string
    const options = {
      url: 'http://localhost:8012/api/vegetables/',
      qs: {deleteNutrients: true},
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 8);
      expect(body[0]).not.to.have.property('nutrients');
      done();
    });
  });

  it('should prevent mixing streaming and documents middleware (maybe)');
  it('should allow streaming out into request.baucis.documents (maybe)'); // , function (done) {
  //   // should set all fields to a string
  //   var options = {
  //     url: 'http://localhost:8012/api/vegetables/',
  //     qs: { streamToArray: true },
  //     json: true
  //   };
  //   request.get(options, function (error, response, body) {
  //     if (error) return done(error);
  //     expect(response.statusCode).to.equal(201);
  //     expect(body).to.have.property('length', 8);
  //     expect(body[0]).to.have.property('name', 'beam');
  //     expect(body[1]).to.have.property('name', 'beam');
  //     expect(body[2]).to.have.property('name', 'beam');
  //     done();
  //   });
  // });

  it('should 404 if request.baucis.documents is undefined, null, or 0 (maybe)'); // , function (done) {
  //       // should set all fields to a string
  //   var options = {
  //     url: 'http://localhost:8012/api/vegetables/',
  //     qs: { emptyIt: true },
  //     json: true
  //   };
  //   request.get(options, function (error, response, body) {
  //     if (error) return done(error);
  //     expect(response.statusCode).to.equal(404);
  //     expect(body).to.equal(1234);
  //     done();
  //   });
  // });

  it('should skip streaming documents out if request.baucis.documents is present (maybe)'); // , function (done) {
  //   var options = {
  //     url: 'http://localhost:8012/api/vegetables/',
  //     qs: { creamIt: true },
  //     json: true
  //   };
  //   request.get(options, function (error, response, body) {
  //     if (error) return done(error);
  //     expect(response.statusCode).to.equal(200);
  //     expect(body).to.equal('Devonshire Clotted Cream.');
  //     done();
  //   });
  // });
  it('should handle injected error middlewares', function(done) {
    const options = {
      url: 'http://localhost:8012/api/etherals/etheral',
      qs: {deleteNutrients: true},
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      try {
        expect(response.statusCode).to.equal(404);
        expect(body.message).to.equal("I'm an etheral, you cannot access me (404).");
      } catch (err) {
        return done(err);
      }
      done();
    });
  });
});
