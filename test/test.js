var assert = require('chai').assert;

describe('Array', function() {

  describe('#indexOf()', function() {

    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });

  });

});

var request = require('supertest');

describe('loading express', function () {

	var server;

	beforeEach(function () {
		server = require('../server');
	});

	afterEach(function () {
		server.close();
	});

	it('responds to /', function testSlash(done) {
		request(server)
			.get('/')
			.expect(200, done);
	});

	it('404 everything else', function testPath(done) {
		request(server)
			.get('/foo/bar')
			.expect(404, done);
	});

	it('responds to /available', function testAvailable(done) {
		var result = request(server)
			.get('/available')
			.expect(200)
		    .end( function (err, res) {
		      assert.equal(res.body, 'Table is available');
		      done();
		    });
	});

	it('responds to /available given starttime', function testAvailableStartTime(done) {
		var result = request(server)
			.get('/available?starttime=1469623836000')
			.expect(200)
		    .end( function (err, res) {
		      assert.equal(res.body, 'Table is reserved');
		      done();
		    });
	});

	it('responds to /schedule', function testSchedule(done) {
		var result = request(server)
			.post('/schedule')
			.expect(200)
		    .end( function (err, res) {
		      assert.equal(res.body, 'Reservation success');
		      done();
		    });
	});

	it('responds to /schedule', function testSchedule(done) {
		var result = request(server)
			.post('/schedule?reserve=75')
			.expect(200)
		    .end( function (err, res) {
		      assert.equal(res.body, 'Reservation failed');
		      done();
		    });
	});

});