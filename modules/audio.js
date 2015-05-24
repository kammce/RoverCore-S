"use strict";
//// Audio feed Controller

/* FFMpeg command:
	ffmpeg -re -f alsa -i "hw:1,0" -acodec libmp3lame -b:a 192k -vn -f rtp rtp://kammce.io:9005
	ffmpeg -re -f alsa -i "hw:1,0" -acodec libmp3lame -b:a 96k -vn -f rtp rtp://kammce.io:9005
*/

var Skeleton = require("./skeleton.js");
Audio.prototype = new Skeleton("Audio");
Audio.prototype.constructor = Audio;

function Audio(feedback) {
	this.feedback = feedback;
	//// Logitech sizes
	// 

	// All possible video feeds
	this.defaults = {
		mic: 1,
		bitrate: "96k"
	};
	this.process = require('child_process');
	this.streams = [
		{ // Chassis Stream
			// Possible streams for stream[0]
			// All streams come from webcams
			// mics: [0 /*navi*/, 1 /*arm*/, 2 /*hull*/],
			current_audio: "off",
			micargs: this.genArg({ mic: 'off' }),
			port: 9005,
			busy: false,
			source: undefined
		},
		{ // Tracker Stream
			// All streams come from webcams
			// mics: [0],
			current_audio: "off",
			micargs: this.genArg({ mic: 'off' }),
			port: 9007,
			busy: false,
			source: undefined
		}
	];
	this.debug = false; // process debug information
	this.schema = {
		"type" : "object",
		"properties" : {
			"nic" : {
				"type" : "number"
			},
			"bitrate" : {
				"type" : "number"
			},
			"stream" : {
				"type" : "number"
			}
		}
	};
}
Audio.prototype.handle = function(data) {
	var parent = this;
	console.log("Handlin' dat!");
	//// Check if data exists
	if(_.isUndefined(data)) { return "Mic data not specified!"; }
	if(_.isUndefined(data["mic"])) { return "MIC was not specified, no action will be taken!"; }
	if(_.isUndefined(data["stream"])) { return "STREAM was not specified, no action will be taken!"; }
	
	var parent = this;
	console.log("Handlin' dat!");
	if(data["mic"] == "off") {
		if(_.isNumber(data["stream"]) && 
			data["stream"] >= 0 && 
			data["stream"] < this.streams.length) {
			if(!_.isUndefined(this.streams[data["stream"]].source)) {
				// Kill camera feed processes
				try {
					this.streams[data["stream"]].source.kill('SIGTERM');
				} catch(e) {
					console.log(e);
					return "COULD NOT KILL VIDEO FEED: "+e;
				}
			}
			return "STREAM "+data["stream"]+" HAS BEEN TURNED OFF";
		}
	}
	// if(data["mic"] == "killall") {
	// 	parent.process.spawn('killall', [ 'ffmpeg' ]);
	// 	return "KILLING OFF ALL FFmpeg PROCESSES.";
	// }
	if(parent.streams[data["stream"]].busy) {
		return "STREAM "+data["stream"]+" IS BUSY IN CONFIGURATIONS";
	}
	parent.streams[data["stream"]].busy = true;
	if(!_.isUndefined(this.streams[data["stream"]].source)) {
		// Kill camera feed processes
		try {
			this.streams[data["stream"]].source.kill('SIGTERM');
		} catch(e) {
			console.log(e);
			this.feedback(this.module, "COULD NOT KILL VIDEO FEED: "+e);
		}
	}
	setTimeout(function() {
		parent.activateMic(data, data["stream"]);
		parent.streams[data["stream"]].busy = false;
	}, 2000);
	return "SWITCHING-AUDIO FEED "+data["STREAM"]+" TO "+data["mic"];
};
Audio.prototype.genArg = function(data, port) {
	if(_.isObject(data)) {
		var mic 	= (_.isNumber(data['mic'])) ? "hw:"+data['mic']+",0" : this.defaults['mic'];
		var bitrate	= (_.isNumber(data['bitrate'])) ? data['bitrate']+"k" : this.defaults['bitrate'];
		this.caminfo = data;
		return [
			'-re',
			'-f', 'alsa',
			'-ac', '2',
			'-i', mic,
			'-acodec', 'libmp3lame',
			'-b:a', bitrate,
			'-vn',
			'-f', 'rtp',
			'rtp://'+ADDRESS+':'+port			
		];
	}
	return false;
};
Audio.prototype.activateMic = function(mic_select, stream_number) {
	var parent = this;
	console.log("Activate Mic!");
	try {
		var args = this.genArg(mic_select, this.streams[stream_number].port);
		if(args == false) {
			parent.feedback(parent.module, "Could not generate arguments for FFmpeg: "+code);
			return;
		}

		this.streams[stream_number].source = this.process.spawn('ffmpeg', 
			args
		).on('error', function( err ){ console.log("ERROR: Either Oculus could not find FFMpeg or Oculus was not run as superuser!!! ",err); });

		this.streams[stream_number].source.stdout.on('data', function(out) {
			if(parent.debug) {
				console.log('stdout: ' + out);
			}
		});
		this.streams[stream_number].source.stderr.on('data', function(err) {
			if(parent.debug) {
				console.log('stderr: ' + err);	
			}
		});	

		this.streams[stream_number].source.on('close', function(code) {
			parent.feedback(parent.module, "MIC "+mic_select["mic"]+" CLOSED, CODE: "+code);
		});
		this.feedback(this.module, "BRINGING UP MIC hw:"+mic_select["mic"]+",0");
	} catch(e) {
		console.log(e);
		this.feedback(this.module, "PROCESS FAILURE STREAM "+stream_number+": "+e);
		//this.mspawn = undefined;
	}
}
Audio.prototype.resume = function() {
	//// Never halted, no need to resume anything

	// Kill camera feed processes
	// try {
	// 	this.activateCamera(this.caminfo);
	// } catch(e) {
	// 	console.log(e);
	// 	this.feedback(this.module, "COULD NOT BRING UP PREVIOUS VIDEO FEED: "+e);
	// 	this.mspawn = undefined;
	// }
	// Bring up previous camera
};
Audio.prototype.halt = function() {
	//// Do not halt anything

	this.process.spawn('killall', [ 'ffmpeg' ]);
	this.process.spawn('killall', [ 'ffmpeg' ]);
	// Kill camera feed processes
	// if(!_.isUndefined(this.mspawn)) {
	// 	// Kill camera feed processes
	// 	try {
	// 		this.mspawn.kill('SIGINT');
	// 	} catch(e) {
	// 		console.log(e);
	// 		this.feedback(this.module, "HALT COULD NOT KILL VIDEO FEED: "+e);
	// 		this.mspawn = undefined;
	// 	}
	// }
};

module.exports = exports = Audio;
