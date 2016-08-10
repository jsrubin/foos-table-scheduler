var assert = require('chai').assert;
var _ = require('underscore');
var request = require('supertest');
var schedule = require('../models/schedule');

describe('schedule.js', function () {

	var schedule,
		sandbox;

	beforeEach(function () {
		schedule = require('../models/schedule');
		sinon = require('sinon');
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
	});

	it('verify minutesToMS', function testMinutesToMS(done) {
		var minutes = 1;
		var result = schedule.minutesToMS(minutes);
		assert.equal(result, 60000);
		done();
	});

	it('verify roundToMinute', function testRoundToMinute(done) {
		var timestamp = 123456;

		var result = schedule.roundToMinute(timestamp);
		assert.equal(result, 120000);
		done();
	});

	it('verify endTime', function testEndTime(done) {
		var reservationStartTime = 1;
		var reservationLength = 2;

		var result = schedule.endTime(reservationStartTime, reservationLength);
		assert.equal(result, 120001);
		done();
	});

	it('verify futureTime', function testFutureTime(done) {
		var hourMinute = '2300';

		var result = schedule.futureTime(hourMinute);
		assert.equal(result, 1470895200000);
		done();
	});

	it('verify futureTime with invalid request time', function testFutureTimeInvalid(done) {
		var hourMinute = '1';

		var result = schedule.futureTime(hourMinute);
		assert.equal(result.msg, 'requested time must be in HMM or HHMM format');
		done();
	});

	it('verify futureTime with past request time', function testFutureTimePast(done) {
		var hourMinute = '100';

		var result = schedule.futureTime(hourMinute);
		assert.equal(result.msg, 'start time cannot be in the past');
		done();
	});

	it('verify futureTime with undefined request time', function testFutureTimeUndefined(done) {
		var hourMinute;

		var result = schedule.futureTime(hourMinute);
		assert.equal(result.msg, 'requested time must be in HMM or HHMM format');
		done();
	});

	it('verify currentTime', function testCurrentTime(done) {
		_.now = sandbox.stub().returns(
			1470895212345
		);
		var result = schedule.currentTime();
		assert.equal(result, 1470895200000);
		done();
	});
});