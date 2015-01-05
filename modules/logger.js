"use strict";

var fs = require('fs');

function Logger(model_ref) {
	this.model = model_ref;
	this.logging = false;
	this.log_date = "";
}
Logger.prototype.log = function(data) {
	var path = 'logs'; //this path describes where to store the logs
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

	//Formatting...
	year = date.getFullYear();
	year = year.toString();
	shorttime = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
	shortdate = date.getMonth() + '-' + date.getDate() + '-' + year.slice(2);
	shortdate = shortdate.toString();
	var logname = shortdate + '~' + shorttime;
	var timerdate = new Date();
	var timestamp = '[' + timerdate.getHours() + ':' + timerdate.getMinutes() + ':' + timerdate.getSeconds() + '.' + timerdate.getMilliseconds() + ']  ';

	//Record the time/date to the logfile
	fs.appendFile(path + '/' + logname, timestamp + data + '\n', function(err){ //records data in log
		if(err){
			console.log(err);
		}
		else{
			//console.log('"' + data + '"' + ' appended to logfile "' + logname + '"');
		}
	});
};

module.exports = exports = Logger;