"use strict";
//// Video feed Controller

/*
 * Command to stream webcam MPEG1Video to server
	ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b:v 800k -r 20 http://127.0.0.1:9001/destroymit/640/480/
 */

var Skeleton = require("./skeleton.js");
Video.prototype = new Skeleton("VIDEO");
Video.prototype.constructor = Video;

function Video(feedback) {
	this.feedback = feedback;
	this.videos = {
		navi: {
			dev: "/dev/video-navi",
			//width: "864",
			//height: "480",
			width: 640,
			height: 480,
			res: 400
		},
		arm: {
			dev: "/dev/video-arm",
			width: 640,
			height: 480,
			res: 400
		},
		hull: { 
			dev: "/dev/video-hull",
			width: 640,
			height: 480,
			res: 400
		},
		tracker: {
			dev: "/dev/video-tracker",
			width: 640,
			height: 480,
			res: 400
		},
		off: {
			dev: "",
			width: 640,
			height: 480,
			res: 400
		}
	};
	this.cams = ["navi", "arm", "hull", "tracker"];
	this.process = require('child_process');
	this.cam_args = this.genArg({ view: 'off' });
	this.caminfo = "off";
	this.debug = true; // process debug information
	this.tspawn; // spawn of tracker process
	this.mspawn; // spawn of multicam process
	this.schema = {
		"type" : "object",
		"properties" : {
			"view" : {
				"type" : "string"
			},
			"res" : {
				"type" : "number"
			},
			"width" : {
				"type" : "number"
			},
			"height" : {
				"type" : "number"
			},
			"fps" : {
				"type" : "number"
			}
		}
	};
}
Video.prototype.handle = function(data) {
	var parent = this;
	console.log("Handlin' dat!");
	if(data["view"] == "tracker") {
		if(!_.isUndefined(this.tspawn)) {
			// Kill camera feed processes
			try {
				this.tspawn.kill('SIGINT');
			} catch(e) {
				console.log(e);
				this.feedback(this.module, "COULD NOT KILL VIDEO FEED: "+e);
				this.tspawn = undefined;
			}
		}
		if(data["view"] == "off") {
			return "OFF";
		}
		if(_.isObject(data)) {
			if(this.cams.indexOf(data["view"]) != -1) {
				setTimeout(function() {
					parent.activateCamera2(data);
				}, 1000);
				return "SWITCHING-VIEW FEED 2 TO "+data["view"];
			}
		}
	} else {
		if(!_.isUndefined(this.mspawn)) {
			// Kill camera feed processes
			try {
				this.mspawn.kill('SIGINT');
			} catch(e) {
				console.log(e);
				this.feedback(this.module, "COULD NOT KILL VIDEO FEED: "+e);
				this.mspawn = undefined;
			}
		}
		if(data["view"] == "off") {
			return "OFF";
		}
		if(_.isObject(data)) {
			if(this.cams.indexOf(data["view"]) != -1) {
				setTimeout(function() {
					parent.activateCamera1(data);
				}, 1000);
				return "SWITCHING-VIEW FEED 1 TO "+data["view"];
			}
		}
	}	
	return "FAIL";
};
Video.prototype.genArg = function(data, port) {
	if(_.isUndefined(data)) { return this.data_args; }	
	if(_.isObject(data)) {
		var view	= data["view"];
		var dev		= this.videos[view]['dev'];
		var res 	= (_.isNumber(data['res'])) ? data['res'] : this.videos[view]['res'];
		var width 	= (_.isNumber(data['width'])) ? data['width'] : this.videos[view]['width'];
		var height 	= (_.isNumber(data['height'])) ? data['height'] : this.videos[view]['height'];
		var fps 	= (_.isNumber(data['fps'])) ? data['fps'] : 20;
		this.cam_args = [
			'-s', width+'x'+height,
			'-f', 'video4linux2',
			'-i', dev,
			'-f', 'mpeg1video',
			'-b:v', res+'k',
			'-r', fps,
			//'-vf', 'crop=iw-mod(iw\,2):ih-mod(ih\,2)',
			'http://'+ADDRESS+':'+port+'/destroymit/'+width+'/'+height
		];
		this.caminfo = data;
	}
	return this.cam_args;
};
Video.prototype.activateCamera1 = function(caminfo) {
	var parent = this;
	console.log("Activate camera!");
	try {
		this.mspawn = this.process.spawn('ffmpeg', 
			this.genArg(caminfo, 9001)
		).on('error', function( err ){ console.log("Oculus could not find ffmpeg... ",err); });

		if(this.debug) {
			this.mspawn.stdout.on('data', function(out) {
				console.log('stdout: ' + out);
			});
			this.mspawn.stderr.on('data', function(err) {
				console.log('stderr: ' + err);
			});	
		}
		this.mspawn.on('close', function(code) {
			parent.feedback(parent.module, "VIEW "+caminfo["view"]+" CLOSED, CODE: "+code);
			//parent.spawn('killall', [ 'ffmpeg' ]);
		});
		this.feedback(this.module, "BRINGING UP VIEW "+caminfo["view"]);
	} catch(e) {
		console.log(e);
		this.feedback(this.module, "PROCESS FAILURE: "+e);
		this.mspawn = undefined;
	}
}

Video.prototype.activateCamera2 = function(caminfo) {
	var parent = this;
	console.log("Activate camera!");
	try {
		this.mspawn = this.process.spawn('ffmpeg', 
			this.genArg(caminfo, 9003)
		).on('error', function( err ){ console.log("Oculus could not find ffmpeg... ",err); });

		if(this.debug) {
			this.mspawn.stdout.on('data', function(out) {
				console.log('stdout: ' + out);
			});
			this.mspawn.stderr.on('data', function(err) {
				console.log('stderr: ' + err);
			});	
		}
		this.mspawn.on('close', function(code) {
			parent.feedback(parent.module, "VIEW "+caminfo["view"]+" CLOSED, CODE: "+code);
			//parent.spawn('killall', [ 'ffmpeg' ]);
		});
		this.feedback(this.module, "BRINGING UP VIEW "+caminfo["view"]);
	} catch(e) {
		console.log(e);
		this.feedback(this.module, "PROCESS FAILURE: "+e);
		this.mspawn = undefined;
	}
}
Video.prototype.resume = function() {
	// Kill camera feed processes
	try {
		this.activateCamera(this.caminfo);
	} catch(e) {
		console.log(e);
		this.feedback(this.module, "COULD NOT BRING UP PREVIOUS VIDEO FEED: "+e);
		this.mspawn = undefined;
	}
	// Bring up previous camera
	
};
Video.prototype.halt = function() {
	// Kill camera feed processes
	if(!_.isUndefined(this.mspawn)) {
		// Kill camera feed processes
		try {
			this.mspawn.kill('SIGINT');
		} catch(e) {
			console.log(e);
			this.feedback(this.module, "HALT COULD NOT KILL VIDEO FEED: "+e);
			this.mspawn = undefined;
		}
	}
};

module.exports = exports = Video;