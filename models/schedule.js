/*
	Assumptions:
		Reservations will only be made for during business hours
		Reservations will not be more than 1 hour time blocks
// */
const store = require('./store');
const _ = require('underscore');

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

schedule.add = function (time) {
  return this.chain()
    .sortBy((time) => this.checkTime(time))
    .value();
};

schedule.checkAvailable = function (starttime) {	
	var year = (new Date(starttime)).getFullYear();
	var month = (new Date(starttime)).getMonth() + 1;
	var date = (new Date(starttime)).getDate();

  	return this.chain()
	    .map((time) => this.checkTime(starttime, time[year][month][date]) )
	    .last()
	    .value();
};