"use strict";

var fs = require('fs');
//var rstream = fs.createReadStream('/dev/ttyACM0');
var exec = require('child_process').exec;
var tty = '/dev/ttyO'+process.argv[2];
console.log("tty = "+tty);
var command = 'stty -F '+tty+' raw speed 115200 && tail -f '+tty;
var setup_stty = exec(command);
var i = 0;
var switcher = function() {
	setTimeout(function() {
		var msg = "hello"+i;
		fs.appendFileSync(tty, msg);
		console.log('hello '+(++i));
		switcher();
	}, 250);
}
switcher();
