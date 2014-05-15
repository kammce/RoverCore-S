"use strict";

if( process.argv.length < 4 ) {
	console.log(
		'Usage: \n' +
		'\tnode cortex.js <websocket-server-address> <stream>\n'+
		'Hints: server address can be\n' +
		'\tlocalhost\n' + 
		'\tor discovery.srkarra.com\n' + 
		'\tor sce.engr.sjsu.edu\n' +
		'\tor kammce.io'
	);
	process.exit();
}

console.log("Starting Rover Oculus");

// GLOBAL Includes
GLOBAL._ = require("underscore");
GLOBAL.fs = require("fs");
GLOBAL.glob = require('glob');
GLOBAL.os = require('os');
// Local Includes
var Socket = require('socket.io-client');
var exec = require('child_process').exec;

// Initializing Variables
GLOBAL.ADDRESS = process.argv[2];
GLOBAL.STREAM = parseInt(process.argv[3]);
var socket = new Socket('http://'+ADDRESS+':8085');

if(STREAM < 0 || STREAM > 1) {
	console.log("You must select a stream between 0 and 2");
	process.exit();
}
var feedback = function(directive, rsignal) {
	if(!_.isUndefined(rsignal)) {
		socket.emit("OCULARSIG", { status: 'feedback', directive: directive, info: rsignal });
	}
}

var sensor_loop;

var Video = require("./modules/video.js");
var video = new Video(feedback, STREAM);
var Audio = require("./modules/audio.js");
var audio = new Audio(feedback, STREAM);

var self_directive = 'OCULUS'+(STREAM+1);

var setNTSC = function (error, stdout, stderr) {
	if (error !== null) {
	  feedback("OCULARSIG", {
			status: 'warning',
			info: 'Stream is oculus1: but count not find /dev/video-tracker, or counld not be set to NTSC.'
	  });
	} else {
		feedback("OCULARSIG", {
			status: 'info',
			info: '/dev/video-tracker set to NTSC :: '+stdout,
	  });
	}
};

socket.on('connect', function () { 
	console.log("Oculus connected to server!");
	// =========== CTRL SIGNAL =========== //
	socket.on('CTRLSIG', function (data) {
		console.log("INCOMING CTRLSIG", data);
		if(_.isUndefined(data["info"])) { return; }
		if(data["info"]["stream"] != STREAM) { return; }
		switch(data['directive']) {
			case 'VIDEO':
				setTimeout(function() { 
					feedback(data['directive'], video._handle(data["info"])); 
				}, 10);
				console.log("Recieved video serversignal", data);
				break;
			case 'AUDIO':
				setTimeout(function() { 
					feedback(data['directive'], audio._handle(data["info"])); 
				}, 10);
				console.log("Recieved video serversignal", data);
				break;
			case self_directive:
				setTimeout(function() { 
					if(data['info']['signal'] == "RESTART") {
						feedback("OCULUS", "Shutting down OCULUS (should be revived by forever-monitor)");
						video._halt();
						audio._halt();
						process.exit();
					} else if(data['info']['signal'] == "SETNTSC") {
						exec('v4l2-ctl -d /dev/video-tracker -s ntsc', setNTSC);
					} else if(data['info']['signal'] == "RESTART") {
						clearInterval(sensor_loop);
						sensor_loop = setTimeout(function() {
							exec('vcgencmd measure_temp', function (error, stdout, stderr) {
								if (error !== null) {
								  feedback("OCULARSIG", {
										status: 'warning',
										info: 'oculus'+STREAM+': Could not measure temperature!'
								  });
								  clearInterval(sensor_loop);
								} else {
									var cpu = stdout.replace("temp=", "").replace("'C", "");
									feedback("SENSORS", {
										device: 'oculus'+STREAM,
										cputemp: parseFloat(cpu)
									});
								}
							});
						}, 1000);
					} else {
						feedback(data['directive'], function() {
							console.log("empty handler for OCULUS", data["info"]);
						});
					}
				}, 10);
				break;
			default:
				console.log("Invalid Directive");
				socket.emit("OCULARSIG", { 
					status: 'warning', 
					info: 'Invalid directive '+data['directive'] 
				});
				break;
		}
	});
	// =========== SERVER SIGNAL =========== //
	socket.on('SERVERSIG', function (data) {
		switch(data['directive']) {
			case 'CONNECT':
				console.log(data['info']+" has connected!");
				break;
			case 'NOTCONNECTED':
				break;
			case 'DISCONNECT':
				console.log(data['info']+" has disconnected!");
				break;
			default:
				console.log("Invalid Directive");
				socket.emit("OCULARSIG", { 
					status: 'warning', 
					info: 'Invalid directive '+data['directive'] 
				});
				break;
		}
	});
	// =========== DISCONNECT SIGNAL =========== //
	socket.on('disconnect', function() {
		console.log('Disconnected from server!');
		process.exit();
	});
	// =========== SEND INITIAL REGISTRATION INFORMATION =========== //
	socket.emit('REGISTER', { entity: 'oculus'+STREAM, password: 'destroymit' });
	if(os.hostname() == 'raspberrypi' || STREAM == '1') {
		setNTSC();
		sensor_loop = setInterval(function() {
			exec('vcgencmd measure_temp', function (error, stdout, stderr) {
				if (error !== null) {
				  feedback("OCULARSIG", {
						status: 'warning',
						info: 'oculus'+STREAM+': Could not measure temperature!'
				  });
				  clearInterval(sensor_loop);
				} else {
					var cpu = stdout.replace("temp=", "").replace("'C\n", "");
					feedback("SENSORS", {
						device: 'oculus'+STREAM,
						cputemp: parseFloat(cpu)
					});
				}
			});
		}, 1000);
	}
});
