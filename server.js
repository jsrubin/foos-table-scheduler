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

var port = process.env.PORT || 8080;
app.set('port', port);

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
  res.status(200).send('ok!');
});

/* Checks whether the table is available now or for a given timestamp
	@param [timestamp of time to check availability]
*/
app.get('/available', function(req, res) {
	var startTime = parseInt(req.query.starttime) || schedule.currentTime();
	var response = schedule.checkAvailable(startTime);

	res.json(response);
});

app.post('/schedule', function(req, res) {
	var reserveLength = parseInt(req.query.reserve) || 15;
	var futureTime = req.query.starttime ? schedule.futureTime(req.query.starttime) : schedule.currentTime();

	if (isNaN(parseInt(futureTime))) {
		res.json(futureTime);
	} else {
		var startTime = parseInt(futureTime) || schedule.currentTime();
		var endTime = schedule.endTime(parseInt(startTime), parseInt(reserveLength));
		var reservedBy = req.query.name || 'anonymous';

		var response = schedule.reserveTable(reserveLength, startTime, reservedBy);

  		res.json(response);
  	}
});

app.delete('/cancel', function(req, res) {
	var startTime = parseInt(req.query.starttime) || schedule.currentTime();
	var response = schedule.cancel(startTime);

	res.json(response);
});

var server = app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + port + '/');
});

module.exports = server;
