"use strict";

var fs = require('fs');

function Logger(model_ref) {
	this.model = model_ref;
	this.logging = false;
	this.log_date = ""; //turned into a string
}

Logger.prototype.log = function(data){ //log is added as a function within function/class "Logger" above. Data == an object
	var path = 'modules/logs'; //this path describes where to store the logs, starting at the rovercore directory
	var date;
	var year;
	var shorttime;
	var shortdate;
	
	//Name a new logfile, otherwise keep writing to the current one.
	if(this.logging == false){
		date = new Date();
		this.log_date = date;
		this.logging = true;
	}
	else{
		date = this.log_date;
	}

	year = date.getFullYear();
	year = year.toString();
	shorttime = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
	shortdate = (date.getMonth() + 1) + '-' + date.getDate() + '-' + year.slice(2);
	shortdate = shortdate.toString();
	var logname = shortdate + '~' + shorttime;
	var timerdate = new Date();
	var timestamp = '[' + timerdate.getHours() + ':' + timerdate.getMinutes() + ':' + timerdate.getSeconds() + '.' + timerdate.getMilliseconds() + ']  ';

	//Record the time/date
	fs.appendFile(path + '/' + logname, timestamp + JSON.stringify(data) + '\n', function(err){ //records data in log
		if(err){
			console.log(err);
		}
		else{
			console.log('"' + JSON.stringify(data) + '"' + ' appended to logfile "' + logname + '"');
		}
	});
	
	//Note: b/c data is an object, use JSON.stringify() to convert it to plain text in JSON style

	//For debugging...
	// console.log('path:' + path);
	// console.log('logname:' + logname);
	// console.log('shorttime:' + shorttime);
	// console.log('shortdate:' + shortdate);
	// console.log('written:' + this.logging);
	// console.log('this.logging:' + this.logging);
	// console.log('this.log_date:' + this.log_date);
	// console.log('timestamp:' + timestamp);
	// console.log('data:' + data);
}

module.exports = exports = Logger; //'module.exports = exports' exports Logger funciton class and its propterties (the extra "exports")