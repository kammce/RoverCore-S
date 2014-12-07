"use strict";

console.log("Starting Rover Cortex");

// Includes
var Socket = require('socket.io-client');
var MindController = require('./modules/mind-controller.js');

// Initializing Variables
var ip = "discovery.srkarra.com"; // Long Range Testing Server in New York
var socket = new Socket('http://'+ip+':8080');
var mcu = new MindController();

socket.on('connect', function () { 
	console.log("Rover connected to server!");
	if(mcu.is_halted) { mcu.resume(); }
	// =========== CTRL SIGNAL =========== //
	socket.on('CTRLSIG', function (data) { 
		console.log("Incoming CTRLSIG", data);
		mcu.logger.log(data);
		switch(data['directive']) {
			case 'MOTOR':
				setTimeout(function() { mcu.motor._handle(data["info"]); }, mcu.priority["motor"]);
				console.log("Found motor directive", data);
				break;
			case 'ARM':
				setTimeout(function() { mcu.arm._handle(data["info"]); }, mcu.priority["arm"]);
				console.log("Found arm directive", data);
				break;
			case 'SENSOR':
				setTimeout(function() { mcu.sensor._handle(data["info"]); }, mcu.priority["sensor"]);
				console.log("Found sensor directive", data);
				break;
			case 'TRACKER':
				setTimeout(function() { mcu.tracker._handle(data["info"]); }, mcu.priority["tracker"]);
				console.log("Found tracker directive", data);
				break;
			case 'ROVER':
				setTimeout(function() { mcu.handle(data["info"]); }, 1);
				break;
			default:
				console.log("Invalid Directive");
				socket.emit("ROVERSIG", { status: 'warning', info: 'Invalid directive '+data['directive'] });
				break;
		}
	});
	// =========== SERVER SIGNAL =========== //
	socket.on('SERVERSIG', function (data) {
		if(data == "MISSION_CONTROL_CONNECTED") {
			console.log("MISSION CONTROL CONNECTED"); 
			mcu.initialize();
		} else if(data == "MISSION_CONTROL_DISCONNECTED") {
			console.log("MISSION CONTROL DISCONNECTED"); 
			mcu.halt();
		}
	});
	// =========== DISCONNECT SIGNAL =========== //
	socket.on('disconnect', function(){
		console.log('Disconnected from server!');
		mcu.halt();
	});
	// =========== SEND INITIAL REGISTRATION INFORMATION =========== //
	socket.emit('REGISTER', { entity: 'rover', password: 'destroymit' });
});
