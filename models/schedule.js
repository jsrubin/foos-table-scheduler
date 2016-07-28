/*
	Assumptions:
		Reservations will only be made for during business hours
		Reservations will not be more than 1 hour time blocks
// */
const store = require('./store');
const _ = require('underscore');

const reservationLengthMaxMinutes = 60;

module.exports = schedule = store('schedule');

/*  Store in lowdb sorted
	{ "1469541307": "15" }
	or 
	{
		"2016": {
			"7": {
				"26": {
					"1469541307": "15"
				}
			}
		}
	}

	_.now()
	(new Date(time)).getFullYear()
	(new Date(time)).getMonth() + 1
	(new Date(time)).getDate()
*/

schedule.checkTime = function (requestedtime, reservations) {
	const hour = (new Date(requestedtime)).getHours();
	const minute = (new Date(requestedtime)).getMinutes();

	var result = true;
	const r = _.each(reservations, function(reservation, resTime) {
		const request = parseInt(requestedtime);
		const reservationStartTime = parseInt(resTime);
		const reservationLength = parseInt(reservation);

		const reservationEndTime = parseInt(reservationStartTime + (reservationLength*60*1000));

		const resHour = parseInt((new Date(reservationStartTime)).getHours());
		const resMinute = parseInt((new Date(reservationStartTime)).getMinutes());

		const start = (new Date(reservationStartTime));
		const e = (new Date(reservationEndTime));
		const req = (new Date(request));


		// console.log("\nrequested time:: " + req.getHours() + ":" + req.getMinutes());
		// console.log("Reservation Start:: " + start.getHours() + ":" + start.getMinutes());
		// console.log("Reservation End:: " + e.getHours() + ":" + e.getMinutes());

		if (result !== false) {
			if (request > reservationStartTime && request <= reservationEndTime) {
				const end = new Date(reservationEndTime);
				// console.log(">>>> table currently booked till " + end);
				result = false;
			} else if (request < reservationStartTime) {
				const availableTill = Math.round(((reservationStartTime - request) / 60) / 1000);
				// console.log(">>>> table available for next " + availableTill + " minutes");
				result = availableTill.toString();
			} else if (request === reservationStartTime) {
				// console.log(">>>> table currently booked");
				result = false;
			}
		}

		return result;
	});

	return result;
};

schedule.reserve = function (reserveLength, startTime) {
	var startValidate = Math.round(startTime/1000);
	var currentTime = Math.round(_.now()/1000);
	var len = parseInt(reserveLength);

	// Validation
	// time cannot be in the past
	// length must be <= 60 minutes reservationLengthMaxMinutes
	if (startValidate < currentTime) {
		console.log("\nWARN: start time cannot be in the past");
		return false;
	}
	if (len > reservationLengthMaxMinutes) {
		console.log("\nWARN: reservation maximum length cannot exceed " + reservationLengthMaxMinutes);
		return false;
	}

	var isAvailable = this.checkAvailable(startTime);
	console.log("\n>>>>>> is table available to reserve? " + isAvailable);

	// store reservation in lowdb
	if (_.isBoolean(isAvailable) && isAvailable != false) {
		var start = parseInt(startTime);
		var year = (new Date(start)).getFullYear();
		var month = (new Date(start)).getMonth() + 1;
		var date = (new Date(start)).getDate();

		console.log("\n>>>>>> reserve table");

	}

	return _.isBoolean(isAvailable) ? isAvailable : false;
};

schedule.reserveTable = function (reserveLength, startTime) {

	return this.chain()
		.map((time) => this.reserve(reserveLength, startTime, time))
		.last()
		.value();
};

schedule.checkAvailable = function (starttime) {
	var start = parseInt(starttime);
	var year = (new Date(start)).getFullYear();
	var month = (new Date(start)).getMonth() + 1;
	var date = (new Date(start)).getDate();

  	return this.chain()
	    .map((time) => this.checkTime(start, time[year][month][date]))
	    .last()
	    .value();
};