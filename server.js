/**
* Server.js 
* 
*/

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var request = require('request');
var url = require('url');
var schedule = require('./models/schedule');

// var rankFILE = 'public/resources/ranking.json';
// var rankingJSON = path.join(__dirname, 'public/resources/ranking.json');
// var humorJSON = path.join(__dirname, 'public/resources/humor.json');
// var rankData = require('./public/resources/ranking.json');
// var humor = require('./public/resources/humor.json');


app.set('port', 8080);

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
  res.status(200).send('ok!');
});

/* Checks whether the table is available now or for a given timestamp
	@param [timestamp of time to check availability]
	@return false if table is currently reserved,
	@return true if table is not reserved any time with the hour,
	@return minutes increment saying table is available for the next X minutes
*/
app.get('/available', function(req, res) {
	var startTime = parseInt(req.query.starttime) || schedule.currentTime();
	var response = schedule.checkAvailable(startTime);
	// var tableIsReservedMsg = 'Table is reserved till ' + avail;
	// var response = (avail == true) ? 'Table is available' : (!parseInt(avail) ? tableIsReservedMsg : 'Table is available for the next ' + avail + ' minutes')
	// var response = {
	// 	'available': ((_.isBoolean(avail) && avail == true) || parseInt(avail)) ? true : false,
	// 	'availableFor': parseInt(avail) ? avail : '',
	// 	'reservedTill': (!_.isBoolean(avail) && !parseInt(avail)) ? avail : '',
	// 	'reservedBy': ''
	//  }

	res.json(response);
});

app.get('/schedule', function(req, res) {
	var reserveLength = parseInt(req.query.reserve) || 15;
	var futureTime = req.query.starttime ? schedule.futureTime(req.query.starttime) : '';

	var startTime = parseInt(futureTime) || schedule.currentTime();
	var endTime = schedule.endTime(parseInt(startTime), parseInt(reserveLength));
	var reservedBy = req.query.name || 'unknown';

	var response = schedule.reserveTable(reserveLength, startTime, reservedBy);
	// var msgSuccess = 'Table reserved for ' + reserveLength + ' minutes from ' + (new Date(startTime)) + ' till ' + (new Date(endTime));
	// var msgFail = 'Table is reserved till ' + reserve;

	// var response = (reserve == true) ? msgSuccess : msgFail;

	// var response = {
	// 	'available': _.isBoolean(reserve) ? !reserve : (parseInt(reserve) ? false : true),
	// 	'availableFor': parseInt(reserve) ? reserve : '',
	// 	'reservedTill': (!_.isBoolean(reserve) && !parseInt(reserve)) ? reserve : '',
	// 	'startTime': (new Date(startTime)),
	// 	'endTime': (new Date(endTime)),
	// 	'reserveLength': reserveLength
	//  }

	// var response = {
	// 	'available': ((_.isBoolean(avail) && avail == true) || parseInt(avail)) ? true : false,
	// 	'availableFor': parseInt(avail) ? avail : '',
	// 	'reservedTill': (!_.isBoolean(avail) && !parseInt(avail)) ? avail : '',
	// 	'reservedBy': ''
	//  }

  	res.json(response);
});

app.get('/cancel', function(req, res) {
	var startTime = parseInt(req.query.starttime) || schedule.currentTime();
	var canceled = schedule.cancel(startTime);
	
	// var response = _.isBoolean(canceled) ? (canceled == true ? 'Reservation was canceled' : 'Failed to cancel reservation') : 'There was an issue canceling the reservation';

	var response = {
		'available': ((_.isBoolean(canceled) && canceled == true) || parseInt(canceled)) ? true : false,
		'availableFor': parseInt(canceled) ? canceled : '',
		'reservedTill': (!_.isBoolean(canceled) && !parseInt(canceled)) ? canceled : ''
	 }

	res.json(response);
});

var server = app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});

module.exports = server;
