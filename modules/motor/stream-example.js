"use strict";

var fs = require('fs');
//var rstream = fs.createReadStream('/dev/ttyACM0');
var exec = require('child_process').exec;
var tty = process.argv[1];
var setup_stty = exec('stty -F /dev/ttyACM'+tty+' raw speed 115200 && tail -f /dev/ttyACM'+tty);

//var position = [90, 50];
var position = [0, 180];
var tog = 0;
var first_timeout = 1000;
var i = 0;
var switcher = function() {
	setTimeout(function() {
		fs.appendFileSync('/dev/ttyACM'+tty, position[tog]+'~');
		if(tog == 0) { tog = 1; } 
		else { tog = 0; }
		first_timeout = 10;
		console.log("sending"+(++i));
		switcher();
	}, first_timeout);
}
switcher();
