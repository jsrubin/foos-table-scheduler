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

schedule.clearExpired = function () {
	// this.set('schedule', []).value()
	return;
};

schedule.isTableAvailable = function (requestedtime) {
	var model = this;
	const currentTime = this.currentTime();
// console.log("current time (rounded to minute): " + (new Date(currentTime)));
// console.log(currentTime);

	var result = true;
	var request = parseInt(requestedtime);
	var reservations = this.value();
// console.log(reservations);
	_.find(reservations, function(res) {
		_.each(res, function(reservation, resTime) {	
			const reservationStartTime = parseInt(resTime);
			const reservationEndTime = model.endTime(reservationStartTime, reservation); //parseInt(reservationStartTime + model.minutesToMS(parseInt(reservation)));
	
	// console.log("\nresTime is..... " + resTime);
	// console.log("\reservationStartTime is..... " + reservationStartTime);

	// console.log("Reservation start time: " + (new Date(reservationStartTime)));
	// console.log("Reservation end time: " + (new Date(reservationEndTime)));
	
			// const resHour = parseInt((new Date(reservationStartTime)).getHours());
			// const resMinute = parseInt((new Date(reservationStartTime)).getMinutes());

			// const start = (new Date(reservationStartTime));
			// const e = (new Date(reservationEndTime));
			// const req = (new Date(request));

			if (result !== false) {
				// console.log("..... requesting to server time " + (new Date(request)));
				// console.log("..... reservation start time..... " + (new Date(reservationStartTime)));
				// console.log("..... reservation end time..... " + (new Date(reservationEndTime)));

				if (request > reservationStartTime) {
					if (request > reservationEndTime) {
						// if reservation is expired/in the past then let's remove
						if (model.currentTime() > reservationEndTime) {
							console.log(">>>> removing expired reservation");
							// delete reservations[resTime];
							var r = _.reject(reservations, function (res, key) {
								return res[resTime];
							});
							model.remove(resTime);
							console.log(r);
						}
					} else {
						const end = new Date(reservationEndTime);
						console.log(">>>> table currently booked till " + end);
						result = end;
					}
				} else if (request < reservationStartTime) {
					const availableTill = Math.round(((reservationStartTime - request) / 60) / 1000);
					console.log(">>>> table available for next " + availableTill + " minutes");
					result = availableTill.toString();
				} else if (request === reservationStartTime) {
					console.log(">>>> table currently booked");
					var resEnd = new Date(reservationEndTime);
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
	}

	return isAvailable; //_.isBoolean(isAvailable) ? isAvailable : false;
};

schedule.reserveTable = function (reserveLength, startTime) {
	return this.reserve(parseInt(reserveLength), parseInt(startTime));
	// return this.chain()
	// 	.map((time) => this.reserve(reserveLength, startTime, time))
	// 	.last()
	// 	.value();
};

schedule.checkAvailable = function (starttime) {
	return this.isTableAvailable(parseInt(starttime));
};