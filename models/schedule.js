/*
	Assumptions:
		Reservations will only be made for during business hours
		Reservations will not be more than 1 hour time blocks
// */
const store = require('./store');
const _ = require('underscore');

const reservationLengthMaxMinutes = 60;

module.exports = schedule = store('schedule');

/*  Store reservation in lowdb
    {
      "available": true,
      "startTime": 1470402780000,
      "endTime": 1470402900000,
      "reservationLength": "5",
      "reservedBy": "jrubin"
    }
*/

schedule.currentTime = function () {
	return this.roundToMinute(_.now());
};

/*
	This function converts HHMM time into millisecond timestamp
*/
schedule.futureTime = function (hourMinute) {
	if (hourMinute.length < 3 || hourMinute.length > 4) {
		console.log("\nWARN: requested time must be in HMM or HHMM format");
		return;
	}
	var hour = hourMinute.length === 3 ? hourMinute.substring(0, 1) : hourMinute.substring(0, 2);
	var minute = hourMinute.substring(hourMinute.length - 2);

	var hmill = hour * 3600000;
	var mmill = minute * 60000;

	var currentMS = this.currentTime();
	var curMinute = (new Date(currentMS)).getMinutes().toString();
	curMinute = curMinute.length === 1 ? '0' + curMinute : curMinute;
	var currentHourMinute = (new Date(currentMS)).getHours().toString() + curMinute;

	var curHourMS = new Date(currentMS).getHours() * 3600000;
	var curMinMS = new Date(currentMS).getMinutes() * 60000;
	
	if (parseInt(hourMinute) > parseInt(currentHourMinute)) {
		var difH = hmill - curHourMS;
		var difM = mmill - curMinMS;
		var future = currentMS + difH + difM;
		return future;
	}
	return;
};

schedule.endTime = function (reservationStartTime, reservationLength) {
	return parseInt(reservationStartTime + this.minutesToMS(parseInt(reservationLength)));
};

schedule.roundToMinute = function (timestamp) {
	var coeff = 1000 * 60;
	return Math.round(timestamp / coeff) * coeff;
};

schedule.minutesToMS = function (minutes) {
	return minutes * 60 * 1000;
};

schedule.cancel = function (timestamp) {
	var model = this;
	var reservations = _.clone(this.value());

	var canceled = false;
	_.find(reservations, function(res) {
		// return _.each(res, function(reservation, resTime) {	
			const reservationStartTime = parseInt(res.startTime);
			const reservationEndTime = model.endTime(reservationStartTime, res.reservationLength);

			if (timestamp >= reservationStartTime && timestamp <= reservationEndTime) {
				model.remove(res);
				canceled = true;
				return true;
			}
		// });
	});
	return canceled;
};

schedule.clearExpired = function () {
	var model = this;
	var currentTime = this.currentTime();
	var reservations = _.clone(this.value());

	_.each(reservations, function(res) {
		_.each(res, function(reservation, resTime) {	
			const reservationStartTime = parseInt(resTime);
			const reservationEndTime = model.endTime(reservationStartTime, reservation);

			// if reservation is expired/in the past then let's remove
			if (currentTime > reservationStartTime && currentTime > reservationEndTime) {
				model.remove(resTime);
			}
		});
	});
};

schedule.isTableAvailable = function (requestedtime, requestedLength) {
	var model = this;
	// var isAvailable = true;
	var request = parseInt(requestedtime);
	var reservations = _.clone(this.value());
	var response = {
		available: true,
		startTime: requestedtime,
		endTime: '',
		reservationLength: requestedLength ? requestedLength.toString() : '',
		reservedBy: ''
	};

	_.each(reservations, function(res) {
		const reservationStartTime = parseInt(res.startTime);
		const reservationEndTime = model.endTime(reservationStartTime, parseInt(res.reservationLength));

		if (response.available === true) {
			if (request >= reservationStartTime) {
				if (request > reservationEndTime) { // if reservation is expired/in the past then let's remove
					if (model.currentTime() > reservationEndTime) {
						console.log(">>>> removing expired reservation");
						model.remove(res);
					}
				} else { // table currently reserved
					const reservedTill = new Date(reservationEndTime);
					console.log(">>>> table currently booked till " + reservedTill);
					response.available = false;
					response.reservedTill = reservedTill;
					// isAvailable = false;
				}
			} else if (request < reservationStartTime) { // we have time before next reservation
				response.available = false;
				// isAvailable = false;
				const availableFor = Math.round(((reservationStartTime - request) / 60) / 1000);
				console.log(">>>> table available for next " + availableFor + " minutes");
				response.availableFor = availableFor.toString();
				// check if we have the enough requested reservation time available before next reservation
				if ((requestedLength && requestedLength < availableFor) || (!requestedLength)) {
					response.available = true;
				}
			}
		}
		return; // isAvailable === false;
	});

	return response;
};
/*
	This function will reserve the table in the db if the requested timeslot is available.
*/
schedule.reserve = function (reserveLength, startTime, reservedBy) {
	var startValidate = this.roundToMinute(startTime);
	var currentTime = this.currentTime();
	var endTime = this.endTime(startTime, reserveLength);

	if (startValidate < currentTime) {
		console.log("\nWARN: start time cannot be in the past");
		return false;
	}
	if (reserveLength > reservationLengthMaxMinutes) {
		console.log("\nWARN: reservation maximum length cannot exceed " + reservationLengthMaxMinutes);
		return false;
	}

	var isAvailable = this.isTableAvailable(startValidate, reserveLength);

	// store reservation in lowdb
	if (isAvailable.available === true) {
		isAvailable.available = false;
		isAvailable.endTime = endTime;
		isAvailable.reservedBy = reservedBy;
		this.push(isAvailable);
		console.log('DEBUG: stored reservation in db ');
		console.log(isAvailable);
		return isAvailable;
	}

	return isAvailable;
};

schedule.cancelReservation = function (timestamp) {
	return this.cancel(timestamp);
};

schedule.reserveTable = function (reserveLength, startTime, reservedBy) {
	return this.reserve(parseInt(reserveLength), parseInt(startTime), reservedBy);
};

schedule.checkAvailable = function (starttime) {
	return this.isTableAvailable(parseInt(starttime));
};