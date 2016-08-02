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

	// const year = (new Date(requestedtime)).getFullYear();
	// const month = (new Date(requestedtime)).getMonth() + 1;
	// const date = (new Date(requestedtime)).getDate();
	// const hour = (new Date(requestedtime)).getHours();
	// const minute = (new Date(requestedtime)).getMinutes();
*/

schedule.currentTime = function () {
	return this.roundToMinute(_.now());
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
		return _.each(res, function(reservation, resTime) {	
			const reservationStartTime = parseInt(resTime);
			const reservationEndTime = model.endTime(reservationStartTime, reservation);

			if (timestamp >= reservationStartTime && timestamp <= reservationEndTime) {
				model.remove(resTime);
				canceled = true;
				return true;
			}
		});
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

schedule.isTableAvailable = function (requestedtime) {
	var model = this;
	var result = true;
	var request = parseInt(requestedtime);
	var reservations = _.clone(this.value());

	_.find(reservations, function(res) {
		_.each(res, function(reservation, resTime) {
			const reservationStartTime = parseInt(resTime);
			const reservationEndTime = model.endTime(reservationStartTime, reservation);

			if (result !== false) {
				if (request > reservationStartTime) {
					if (request > reservationEndTime) {
						// if reservation is expired/in the past then let's remove
						if (model.currentTime() > reservationEndTime) {
							// console.log(">>>> removing expired reservation");
							model.remove(resTime);
						}
					} else {
						const end = new Date(reservationEndTime);
						// console.log(">>>> table currently booked till " + end);
						result = end;
					}
				} else if (request < reservationStartTime) {
					const availableTill = Math.round(((reservationStartTime - request) / 60) / 1000);
					// console.log(">>>> table available for next " + availableTill + " minutes");
					result = availableTill.toString();
				} else if (request === reservationStartTime) {
					// console.log(">>>> table currently booked");
					const resEnd = new Date(reservationEndTime);
					result = resEnd;
				}
			}
			return;
		});
		return result !== true;
	});

	return result;
};

schedule.reserve = function (reserveLength, startTime, time) {
	var startValidate = this.roundToMinute(startTime);
	var currentTime = this.currentTime();
	var len = parseInt(reserveLength);

	if (startValidate < currentTime) {
		console.log("\nWARN: start time cannot be in the past");
		return false;
	}
	if (len > reservationLengthMaxMinutes) {
		console.log("\nWARN: reservation maximum length cannot exceed " + reservationLengthMaxMinutes);
		return false;
	}

	var isAvailable = this.checkAvailable(startValidate);

	// store reservation in lowdb
	if (_.isBoolean(isAvailable) && isAvailable !== false) {
		var addTime = { [startValidate]: reserveLength.toString() };
		this.push(addTime);
		console.log('...stored in db ');
		console.log(addTime);
		isAvailable = false;
	}

	return isAvailable;
};

schedule.cancelReservation = function (timestamp) {
	return this.cancel(timestamp);
};

schedule.reserveTable = function (reserveLength, startTime) {
	return this.reserve(parseInt(reserveLength), parseInt(startTime));
};

schedule.checkAvailable = function (starttime) {
	return this.isTableAvailable(parseInt(starttime));
};