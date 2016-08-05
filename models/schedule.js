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

	// var response = {
	// 	'available': ((_.isBoolean(avail) && avail == true) || parseInt(avail)) ? true : false,
	// 	'availableFor': parseInt(avail) ? avail : '',
	// 	'reservedTill': (!_.isBoolean(avail) && !parseInt(avail)) ? avail : '',
	// 	'reservedBy': ''
	//  }

schedule.isTableAvailable = function (requestedtime, requestedLength) {
	var model = this;
	var isAvailable = true;
	var request = parseInt(requestedtime);
	var reservations = _.clone(this.value());

	_.find(reservations, function(res) {
		const reservationStartTime = parseInt(res.startTime);
		const reservationEndTime = model.endTime(reservationStartTime, res.reservationLength);

		if (isAvailable === true) {
			if (request > reservationStartTime) {
				if (request > reservationEndTime) {
					// if reservation is expired/in the past then let's remove
					if (model.currentTime() > reservationEndTime) {
						// console.log(">>>> removing expired reservation");
						model.remove(res);
					}
				} else {
					const end = new Date(reservationEndTime);
					// console.log(">>>> table currently booked till " + end);
					isAvailable = res; //end;
				}
			} else if (request < reservationStartTime) {
				const availableTill = Math.round(((reservationStartTime - request) / 60) / 1000);
				// console.log(">>>> table available for next " + availableTill + " minutes");
				if ((requestedLength && requestedLength < availableTill) || (!requestedLength)) {
					res.available = true;
					res.availableTill = availableTill.toString();
					isAvailable = res; //availableTill.toString();
				}
			} else if (request === reservationStartTime) {
				// console.log(">>>> table currently booked");
				const resEnd = new Date(reservationEndTime);
				isAvailable = res; //resEnd;
			}
		}
		return isAvailable !== true;
	});

	return isAvailable;
};
/*
  {
      "available": false,
      "startTime": "1470317400000",
      "endTime": "1470317400000",
      "reservationLength" : "15",
      "reservedBy": "jrubin"
    }
    */

schedule.reserve = function (reserveLength, startTime, reservedBy) {
	var startValidate = this.roundToMinute(startTime);
	var currentTime = this.currentTime();
	var len = parseInt(reserveLength);
	var endTime = this.endTime(startTime, reserveLength);

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
	if (_.isBoolean(isAvailable) || isAvailable.available === true) {
		var addReservation = {
			available: false,
			startTime: startValidate,
			endTime: endTime,
			reservationLength: reserveLength.toString(),
			reservedBy: reservedBy
		};
		this.push(addReservation);
		console.log('DEBUG: stored reservation in db ');
		console.log(addReservation);
		return addReservation;
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