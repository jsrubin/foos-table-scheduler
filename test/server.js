var assert = require('chai').assert;
var request = require('supertest');
var schedule = require('../models/schedule');
var _ = require('underscore');

describe('server.js', function() {

	var server,
		sandbox;

	beforeEach(function () {
		server = require('../server');
		sinon = require('sinon');
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
		server.close();
	});

	describe('loading express', function () {

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
	});

	describe('GET /available', function () {
		it('responds to /available', function testAvailable(done) {
			schedule.checkAvailable = sandbox.stub().returns(
				{ available: true }
			);
			var result = request(server)
				.get('/available')
				.expect(200)
			    .end( function (err, res) {
			      assert.equal(res.body.available, true);
			      done();
			    });
		});

		it('responds to /available when not available', function testNotAvailable(done) {
			schedule.checkAvailable = sandbox.stub().returns(
				{ available: false }
			);
			var result = request(server)
				.get('/available?starttime=123')
				.expect(200)
			    .end( function (err, res) {
			      assert.equal(res.body.available, false);
			      done();
			    });
		});

		it('responds to /available when invalid time', function testAvailableInvalidStartTime(done) {
			schedule.checkAvailable = sandbox.stub().returns(
				{ available: false }
			);
			var result = request(server)
				.get('/available?starttime=abc')
				.expect(200)
			    .end( function (err, res) {
			      assert.equal(res.body.available, false);
			      done();
			    });
		});
	});

	describe('POST /schedule', function () {

		it('responds to /schedule with default values', function testSchedule(done) {
			var starttime = '800'
			var reservedBy = 'anonymous';
			var reserve = '15';
			schedule.reserveTable = sandbox.stub().returns(
				{
					available: false,
	  				startTime: 1470582000000,
	  				endTime: 1470582900000,
	  				reservationLength: reserve,
	  				reservedBy: reservedBy
				}
			);
			var result = request(server)
				.post('/schedule')
				.expect(200)
			    .end( function (err, res) {
			    	assert.equal(res.body.available, false);
			      assert.equal(res.body.reservedBy, reservedBy);
			      done();
			    });
		});

		it('responds to /schedule given start time', function testScheduleStarttime(done) {
			var starttime = '2300'
			var reservedBy = 'anonymous';
			var reserve = '15';
			schedule.reserveTable = sandbox.stub().returns(
				{
					available: false,
	  				startTime: 1470582000000,
	  				endTime: 1470582900000,
	  				reservationLength: reserve,
	  				reservedBy: reservedBy
				}
			);
			var result = request(server)
				.post('/schedule?starttime=' + starttime)
				.expect(200)
			    .end( function (err, res) {
			    	assert.equal(res.body.available, false);
			      assert.equal(res.body.reservedBy, reservedBy);
			      done();
			    });
		});

		it('responds to /schedule given start time and reserve length', function testScheduleWithStartAndReserve(done) {
			var starttime = '2300'
			var reservedBy = 'tester';
			var reserve = '15';
			schedule.reserveTable = sandbox.stub().returns(
				{
					available: false,
	  				startTime: 1470582000000,
	  				endTime: 1470582900000,
	  				reservationLength: reserve,
	  				reservedBy: reservedBy
				}
			);
			var result = request(server)
				.post('/schedule?reserve=' + reserve + '&starttime=' + starttime + "&name=" + reservedBy)
				.expect(200)
			    .end( function (err, res) {
			    	assert.equal(res.body.available, false);
			    	assert.equal(res.body.reservationLength, reserve);
			     	assert.equal(res.body.reservedBy, reservedBy);
			     	done();
			    });
		});

		it('responds to /schedule with exceeded reservation time', function testScheduleExceedReservation(done) {
			var starttime = '800'
			var reservedBy = 'anonymous';
			var reserve = '75';
			var msg = 'reservation maximum length cannot exceed 60';
			schedule.reserveTable = sandbox.stub().returns(
				{
					available: false,
				  	msg: msg
				}
			);
			var result = request(server)
				.post('/schedule?reserve=' + reserve)
				.expect(200)
			    .end( function (err, res) {
			      assert.equal(res.body.msg, msg);
			      done();
			    });
		});

		it('responds to /schedule with start time in the past', function testScheduleInPast(done) {
			var starttime = '400'
			var reservedBy = 'anonymous';
			var reserve = '75';
			var msg = 'start time cannot be in the past';
			schedule.reserveTable = sandbox.stub().returns(
				{
					available: false,
				  	msg: msg
				}
			);
			var result = request(server)
				.post('/schedule?starttime=' + starttime)
				.expect(200)
			    .end( function (err, res) {
			      assert.equal(res.body.msg, msg);
			      done();
			    });
		});

		it('responds to /schedule with invalid format start time', function testScheduleInvalidStart(done) {
			var starttime = 'a'
			var reservedBy = 'anonymous';
			var reserve = '75';
			var msg = 'requested time must be in HMM or HHMM format';
			schedule.reserveTable = sandbox.stub().returns(
				{
					available: false,
				  	msg: msg
				}
			);
			var result = request(server)
				.post('/schedule?starttime=' + starttime)
				.expect(200)
			    .end( function (err, res) {
			      assert.equal(res.body.msg, msg);
			      done();
			    });
		});
	});

	describe('DELETE /cancel', function () {

		it('responds to /cancel', function testCancel(done) {
			schedule.cancel = sandbox.stub().returns(
				{ available: true }
			);
			var result = request(server)
				.delete('/cancel')
				.expect(200)
			    .end( function (err, res) {
			      assert.equal(res.body.available, true);
			      done();
			    });
		});
	});
});