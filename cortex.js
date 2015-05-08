"use strict";

if( process.argv.length < 3 ) {
	console.log(
		'Usage: \n' +
		'\tnode cortex.js <websocket-server-address> [--simulate]\n'+
		'Hints: server address can be\n' +
		'\tlocalhost\n' + 
		'\tor discovery.srkarra.com'
	);
	process.exit();
}

console.log("Starting Rover Cortex");

// GLOBAL Includes
GLOBAL._ = require("underscore");
GLOBAL.fs = require("fs");
GLOBAL.glob = require('glob');
GLOBAL.os = require('os');
GLOBAL.async = require('async');
GLOBAL.simulate = false;
GLOBAL.production = false;
if(process.argv[3] == "--simulate") {
	simulate = true;
}

if(os.hostname() == 'beaglebone') {
	GLOBAL.SERIALPORT = require('serialport');
	GLOBAL.I2C = require('i2c');
	GLOBAL.SPINE = require('./modules/spine.js');
}
// Local Includes
var Socket = require('socket.io-client');
var MindController = require('./modules/mind-controller.js');

// Initializing Variables
GLOBAL.ADDRESS = process.argv[2];
var socket = new Socket('http://'+ADDRESS+':8085');

var feedback = function(directive, rsignal) {
	if(!_.isUndefined(rsignal) && !_.isUndefined(directive)) {
		socket.emit("ROVERSIG", { status: 'feedback', directive: directive, info: rsignal });
	}
}

var mcu = new MindController(feedback, simulate);

socket.on('connect', function () { 
	console.log("RoverCore is connected to server!");
	if(mcu.is_halted) { mcu.resume(); }
	if(!mcu.is_initialized) { mcu.initialize(); }
	// =========== CTRL SIGNAL =========== //
	socket.on('CTRLSIG', function (data) { 
		console.log("INCOMING CTRLSIG", data);
		//mcu.logger.log(data);
		switch(data['directive']) {
			case 'MOTOR':
				setTimeout(function() { 
					feedback(data['directive'], mcu.motor._handle(data["info"])); 
				}, mcu.priority["motor"]);
				console.log("Recieved motor directive", data);
				break;
			case 'ARM':
				setTimeout(function() { 
					feedback(data['directive'], mcu.arm._handle(data["info"])); 
				}, mcu.priority["arm"]);
				console.log("Recieved arm directive", data);
				break;
			case 'SENSOR':
				setTimeout(function() { 
					feedback(data['directive'], mcu.sensor._handle(data["info"])); 
				}, mcu.priority["sensor"]);
				console.log("Recieved sensor directive", data);
				break;
			case 'TRACKER':
				setTimeout(function() { 
					feedback(data['directive'], mcu.tracker._handle(data["info"])); 
				}, mcu.priority["tracker"]);
				console.log("Recieved tracker directive", data);
				break;
			case 'VIDEO':
				setTimeout(function() { 
					feedback(data['directive'], mcu.video._handle(data["info"])); 
				}, mcu.priority["tracker"]);
				console.log("Recieved video serversignal", data);
				break;
			case 'CORTEX':
				setTimeout(function() { 
					feedback(data['directive'], mcu.handle(data["info"]));
				}, 1);
				break;
			default:
				console.log("Invalid Directive");
				socket.emit("ROVERSIG", { 
					status: 'warning', 
					info: 'Invalid directive '+data['directive'] 
				});
				break;
		}
	});
	// =========== SERVER SIGNAL =========== //
	socket.on('SERVERSIG', function (data) {
		console.log(data);
		// =========== PRODUCTION MODE =========== // 
		if(production == true) {
			if(data == "MISSION_CONTROL_CONNECTED") {
				console.log("MISSION CONTROL CONNECTED"); 
				mcu.initialize();
			} else if(data == "MISSION_CONTROL_DISCONNECTED") {
				console.log("MISSION CONTROL DISCONNECTED"); 
				mcu.halt();
			}
		} else {
			// =========== DEBUG MODE =========== // 
			// MCU will handle disconnects and such.
			mcu.handle(data);
		}
	});
	// =========== DISCONNECT SIGNAL =========== //
	socket.on('disconnect', function(){
		console.log('Disconnected from server!');
		mcu.halt();
		process.exit();
	});
	// =========== SEND INITIAL REGISTRATION INFORMATION =========== //
	socket.emit('REGISTER', { entity: 'cortex', password: 'destroymit' });
});
