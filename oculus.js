"use strict";

if( process.argv.length < 3 ) {
	console.log(
		'Usage: \n' +
		'\tnode cortex.js <websocket-server-address>\n'+
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
// Local Includes
var Socket = require('socket.io-client');

// Initializing Variables
GLOBAL.ADDRESS = process.argv[2];
var socket = new Socket('http://'+ADDRESS+':8085');

var feedback = function(directive, rsignal) {
	if(!_.isUndefined(rsignal)) {
		socket.emit("OCULARSIG", { status: 'feedback', directive: directive, info: rsignal });
	}
}

var Video = require("./modules/video.js");
var video = new Video(feedback);
var Audio = require("./modules/audio.js");
var audio = new Audio(feedback);

socket.on('connect', function () { 
	console.log("Oculus connected to server!");
	// =========== CTRL SIGNAL =========== //
	socket.on('CTRLSIG', function (data) { 
		console.log("INCOMING CTRLSIG", data);
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
			case 'OCULUS':
				setTimeout(function() { 
					if(data['info'] == "RESTART") {
						feedback("OCULUS", "Shutting down OCULUS (should be revived by forever-monitor)");
						process.exit();
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
	socket.emit('REGISTER', { entity: 'oculus', password: 'destroymit' });
});
