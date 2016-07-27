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

/* Checks whether the table is available now or for a given timestamp
	@param [timestamp of time to check availability]
	@return false if table is currently reserved,
	@return true if table is not reserved any time with the hour,
	@return minutes increment saying table is available for the next X minutes
*/
app.get('/available', function(req, res) {
	var startTime = req.query.starttime || _.now();

	var avail = schedule.checkAvailable(startTime);
	console.log("\n\n GET/ available.....");
	console.log(avail);
	var response = _.isBoolean(avail) ? (avail == true ? 'Table is available' : 'Table is reserved') : 'Table is available for the next ' + avail + ' minutes'

	res.json(response);
});

app.post('/schedule', function(req, res) {
	var reserveIncrement = req.query.reserve;
	var startTime = req.query.starttime;
	// var ranking = { "ranking": req.body.payload };
 	// var payload = _.extend(ranking, humor);

	// fs.writeFile(rankFILE, JSON.stringify(req.body), function (err) {
	  if (err) return console.log(err)
	  console.log(JSON.stringify(payload))
	  console.log('writing to ' + rankFILE)
	// });

  	res.json(payload);
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
