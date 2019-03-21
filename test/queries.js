const {expect} = require('chai');
const request = require('request');
const parselinks = require('parse-links');

const fixtures = require('./fixtures');

describe('Queries', function() {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should support skip 1', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?skip=1',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', vegetables.length - 1);
      done();
    });
  });

  it('should support skip 2', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?skip=2',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', vegetables.length - 2);
      done();
    });
  });

  it('should support limit 1', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=1',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 1);
      done();
    });
  });

  it('should support limit 2', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 2);
      done();
    });
  });

  it('disallows selecting deselected fields', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?select=species+lastModified',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Including excluded fields is not permitted (403).');
      done();
    });
  });

  it('disallows populating deselected fields 1', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?populate=species',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Including excluded fields is not permitted (403).');
      done();
    });
  });

  it('disallows populating deselected fields 2', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?populate={ "path": "species" }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Including excluded fields is not permitted (403).');
      done();
    });
  });

  it('should support default express query parser when using populate', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?populate[path]=species',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Including excluded fields is not permitted (403).');
      done();
    });
  });

  it('disallows using +fields with populate', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?populate={ "select": "%2Bboiler" }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property(
        'message',
        'Selecting fields of populated documents is not permitted (403).'
      );
      done();
    });
  });

  it('disallows using +fields with select', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?select=%2Bboiler',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Including excluded fields is not permitted (403).');
      done();
    });
  });

  it('disallows selecting fields when populating', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?populate={ "path": "a", "select": "arbitrary" }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property(
        'message',
        'Selecting fields of populated documents is not permitted (403).'
      );
      done();
    });
  });

  it('should not crash when disallowing selecting fields when populating', function(done) {
    const options = {
      url:
        'http://localhost:8012/api/vegetables?populate=[{ "path": "a", "select": "arbitrary actuary" }, { "path": "b", "select": "arbitrary actuary" }]',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property(
        'message',
        'Selecting fields of populated documents is not permitted (403).'
      );
      done();
    });
  });

  it('disallows selecting fields when populating', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?populate={ "path": "a", "select": "arbitrary" }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property(
        'message',
        'Selecting fields of populated documents is not permitted (403).'
      );
      done();
    });
  });

  it('allows populating children', function(done) {
    const id = vegetables[0]._id;
    const options = {
      url: `http://localhost:8012/api/vegetables/${id}/?populate=nutrients`,
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('nutrients');
      expect(body.nutrients).to.have.property('length', 1);
      expect(body.nutrients[0]).to.have.property('color', 'Blue');
      done();
    });
  });

  it('allows query by Id', function(done) {
    const id = vegetables[0]._id;
    const options = {
      url: `http://localhost:8012/api/vegetables/${id}`,
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('name', 'Turnip');
      done();
    });
  });

  it('allows default express query string format', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?conditions[name]=Radicchio',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 1);
      expect(body[0]).to.have.property('name', 'Radicchio');
      done();
    });
  });

  it('allows selecting fields', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?select=-_id lastModified',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body[0]).not.to.have.property('_id');
      expect(body[0]).not.to.have.property('name');
      expect(body[0]).to.have.property('lastModified');
      done();
    });
  });

  it('allows setting default sort', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      let lastMineral = '';
      body.forEach(function(mineral) {
        expect(mineral.color > lastMineral).to.be.true;
        lastMineral = mineral.color;
      });
      done();
    });
  });

  it('allows overriding default sort', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?sort=-color',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      let lastMineral = '';
      body.forEach(function(mineral) {
        if (lastMineral) expect(mineral.color < lastMineral).to.be.true;
        lastMineral = mineral.color;
      });
      done();
    });
  });

  it('allows deselecting hyphenated field names', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?select=-hyphenated-field-name',
      json: true
    };
    request.get(options, function(err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.equal(200);
      expect(body[0]).to.have.property('_id');
      expect(body[0]).to.have.property('__v');
      expect(body[0]).not.to.have.property('hpyhenated-field-name');
      done();
    });
  });

  it('should not add query string to the search link (collection)', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?sort=color',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      const expected = '</api/minerals>; rel="search", ' + '</api/minerals?sort=color>; rel="self"';
      expect(response.statusCode).to.equal(200);
      expect(response.headers.link).to.equal(expected);
      done();
    });
  });

  it('should not add query string to the search link (instance)', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals',
      json: true
    };

    request.get(options, function(error, response, body) {
      if (error) return done(error);

      const id = body[0]._id;
      const options = {
        url: `http://localhost:8012/api/minerals/${id}?sort=color`,
        json: true
      };

      request.get(options, function(error, response, body) {
        if (error) return done(error);

        const expected = `${'</api/minerals>; rel="collection", ' +
          '</api/minerals>; rel="search", ' +
          '</api/minerals/'}${id}>; rel="edit", </api/minerals/${id}>; rel="self"`;
        expect(response.statusCode).to.equal(200);
        expect(response.headers.link).to.equal(expected);
        done();
      });
    });
  });

  it('should send 400 if limit is invalid', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=-1',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(response.headers).not.to.have.property('link');
      expect(body).to.have.property('message', 'Limit must be a positive integer if set (400).');
      done();
    });
  });

  it('should send 400 if limit is invalid', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=0',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(response.headers).not.to.have.property('link');
      expect(body).to.have.property('message', 'Limit must be a positive integer if set (400).');
      done();
    });
  });

  it('should send 400 if limit is invalid', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=3.6',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(response.headers).not.to.have.property('link');
      expect(body).to.have.property('message', 'Limit must be a positive integer if set (400).');
      done();
    });
  });

  it('should send 400 if limit is invalid', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit= asd  asd ',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(response.headers).not.to.have.property('link');
      expect(body).to.have.property('message', 'Limit must be a positive integer if set (400).');
      done();
    });
  });

  it('should send 400 if skip is invalid', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?skip=1.1',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(response.headers).not.to.have.property('link');
      expect(body).to.have.property('message', 'Skip must be a non-negative integer if set (400).');
      done();
    });
  });

  it('should send 400 if count is invalid', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?count=1',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(response.headers).not.to.have.property('link');
      expect(body).to.have.property('message', 'Count must be "true" or "false" if set (400).');
      done();
    });
  });

  it('allows adding paging links', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      done();
    });
  });

  it('should not return paging links if limit not set', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?sort=name',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers.link).to.contain('rel="self"');
      expect(response.headers.link).to.contain('rel="search"');
      expect(response.headers.link).to.not.contain('rel="first"');
      expect(response.headers.link).to.not.contain('rel="last"');
      expect(response.headers.link).to.not.contain('rel="next"');
      expect(response.headers.link).to.not.contain('rel="previous"');
      done();
    });
  });

  it('should not return paging links if relations are not enabled', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers.link).to.equal(undefined);
      done();
    });
  });

  it('allows using relations: true with sorted queries', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?sort=color&limit=2&skip=2&select=-__v -_id -enables',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers.link).to.contain('rel="first"');
      expect(response.headers.link).to.contain('rel="last"');
      expect(response.headers.link).to.contain('rel="next"');
      expect(response.headers.link).to.contain('rel="previous"');
      expect(body).to.eql([{color: 'Indigo'}, {color: 'Orange'}]);
      done();
    });
  });

  it('should return next for first page', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      expect(response.headers.link).to.contain('rel="next"');
      done();
    });
  });

  it('should return previous for second page', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2&skip=2',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      expect(response.headers.link).to.contain('rel="previous"');
      done();
    });
  });

  it('should not return paging links previous for first page', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      expect(response.headers.link).not.to.contain('rel="previous"');
      done();
    });
  });

  it('should not return paging links next for last page', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2&skip=6',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      expect(response.headers.link).not.to.contain('rel="next"');
      done();
    });
  });

  it('should preserve query in paging links', function(done) {
    const conditions = JSON.stringify({color: {$regex: '.*e.*'}});
    const options = {
      url: `http://localhost:8012/api/minerals?limit=1&skip=0&conditions=${conditions}`,
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      expect(response.headers.link).to.contain('rel="next"');
      const links = parselinks(response.headers.link);
      expect(links.next).to.contain(`conditions=${encodeURIComponent(conditions)}`);
      done();
    });
  });

  it('allows retrieving paging links next', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2&skip=0',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);

      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');

      const links = parselinks(response.headers.link);
      expect(links).to.have.property('next');

      const options = {
        url: `http://localhost:8012${links.next}`,
        json: true
      };
      request.get(options, function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  it('allows retrieving paging links previous', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2&skip=2',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      const links = parselinks(response.headers.link);
      expect(links).to.have.property('previous');
      const options = {
        url: `http://localhost:8012${links.previous}`,
        json: true
      };
      request.get(options, function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  it('allows retrieving paging links last', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2&skip=6',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      const links = parselinks(response.headers.link);
      expect(links).to.have.property('first');
      const options = {
        url: `http://localhost:8012${links.first}`,
        json: true
      };
      request.get(options, function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  it('allows retrieving paging links first', function(done) {
    const options = {
      url: 'http://localhost:8012/api/minerals?limit=2&skip=0',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('link');
      const links = parselinks(response.headers.link);
      expect(links).to.have.property('last');
      const options = {
        url: `http://localhost:8012${links.last}`,
        json: true
      };
      request.get(options, function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  it('allows retrieving count instead of documents', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?count=true',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.equal(8);
      done();
    });
  });

  it('should not send count if count is not set to true', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?count=false',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).not.to.be.a('number');
      done();
    });
  });

  it('should report bad hints', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?hint={ "foogle": 1 }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(body).to.have.property('message', 'The requested query hint is invalid (400).');
      done();
    });
  });

  it('sets status to 400 if hint used with count', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?count=true&hint={ "foogle": 1 }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(body).to.have.property('message', "Hint can't be used with count (400).");
      done();
    });
  });

  it('allows adding index hint', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?hint={ "_id": 1 }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('allows adding index hint', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?hint[_id]=1',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('sets status to 400 if comment used with count', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?count=true&comment=salve',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(body).to.have.property('message', "Comment can't be used with count (400).");
      done();
    });
  });

  it('allows adding a query comment', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?comment=testing testing 123',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should not allow adding an index hint if not enabled', function(done) {
    const options = {
      url: 'http://localhost:8012/api/fungi?hint={ "_id": 1 }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property('message', 'Hints are not enabled for this resource (403).');
      done();
    });
  });

  it('should ignore query comments if not enabled', function(done) {
    const options = {
      url: 'http://localhost:8012/api/fungi?comment=testing testing 123',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 1);
      done();
    });
  });

  it('allows querying for distinct values', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?distinct=name',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      body.sort();
      expect(body).to.have.property('length', 8);
      expect(body[0]).to.equal('Carrot');
      expect(body[1]).to.equal('Lima Bean');
      expect(body[2]).to.equal('Pea');
      expect(body[3]).to.equal('Radicchio');
      expect(body[4]).to.equal('Shitake');
      expect(body[5]).to.equal('Spinach');
      expect(body[6]).to.equal('Turnip');
      expect(body[7]).to.equal('Zucchini');
      done();
    });
  });

  it('allows querying for distinct values restricted by conditions', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?distinct=name&conditions={ "name": "Carrot" }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 1);
      expect(body[0]).to.equal('Carrot');
      done();
    });
  });

  it('should not allow querying for distinct values of deselected paths', function(done) {
    const options = {
      url: 'http://localhost:8012/api/fungi?distinct=hyphenated-field-name',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(403);
      expect(body).to.have.property(
        'message',
        'You may not find distinct values for the requested path (403).'
      );
      done();
    });
  });

  it('allows using query operators with _id', function(done) {
    const options = {
      url:
        'http://localhost:8012/api/vegetables?conditions={ "_id": { "$gt": "111111111111111111111111" } }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(200);
      expect(body).to.have.property('length', 8);
      expect(body[0]).to.have.property('name', 'Turnip');
      done();
    });
  });

  it('should give a 400 if the query string is unpar using query operators with _id', function(done) {
    const options = {
      url:
        "http://localhost:8012/api/vegetables?conditions={ '_id': { '$gt': '111111111111111111111111' } }",
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      // before:  'The conditions query string value was not valid JSON: "Unexpected token \'" (400).'
      // after:   'The conditions query string value was not valid JSON: "Unexpected token \' in JSON at position 2" (400).'
      // test changed to be less fragile
      expect(body).to.have.property('message');
      expect(body.message).to.contain(
        'The conditions query string value was not valid JSON: "Unexpected token \''
      );
      done();
    });
  });

  it('disallows $explain by default', function(done) {
    const options = {
      url: 'http://localhost:8012/api/vegetables?conditions={ "$explain": true }',
      json: true
    };
    request.get(options, function(error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.equal(400);
      expect(body).to.have.property(
        'message',
        'Using $explain is disabled for this resource (400).'
      );
      done();
    });
  });
});
