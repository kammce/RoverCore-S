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
	//// Logitech sizes
	//640x480 160x90 160x120 176x144 320x180 320x240 352x288 432x240 640x360 800x448 800x600 ++ 864x480 ++ (1st Fav) 960x720 +1024x576+ (0th Fav) 1280x720 1600x896 1920x1080 2304x1296 2304x1536


	// All possible video feeds
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
		off: { dev: "" }
	};
	this.process = require('child_process');
	this.streams = [
		{ // Omni Stream
			// Possible streams for stream[0]
			cams: ["navi", "arm", "hull"],
			current_view: "off",
			camargs: this.genArg({ view: 'off' }),
			port: 9001,
			busy: false,
			source: undefined
		},
		{ // Tracker Stream
			// Possible streams for stream[1]
			cams: ["tracker"],
			current_view: "off",
			camargs: this.genArg({ view: 'off' }),
			port: 9003,
			busy: false,
			source: undefined
		}
	];
	this.debug = false; // process debug information
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
			},
			"stream" : { // if view is off, this is the stream number to to turn off.
				"type" : "number"
			}
		}
	};
}
Video.prototype.handle = function(data) {
	var parent = this;
	console.log("Handlin' dat!");
	//// Check if data exists
	if(_.isUndefined(data["view"])) {
		return "VIEW was not specified, no action will be taken!";
	}
	if(data["view"] == "off") {
		if(_.isNumber(data["stream"]) && 
			data["stream"] >= 0 && 
			data["stream"] < this.streams.length) {
			// Kill camera feed processes
			try {
				this.streams[data["stream"]].source.kill('SIGINT');
			} catch(e) {
				console.log(e);
				return "COULD NOT KILL VIDEO FEED: "+e;
				//this.streams[i].source = undefined;
			}
			return "STREAM "+data["stream"]+" HAS BEEN TURNED OFF";
		}
	}
	if(data["view"] == "killall") {
		parent.spawn('killall', [ 'ffmpeg' ]);
		return "KILLING OFF ALL FFmpeg PROCESSES.";
	}
	for (var i = this.streams.length - 1; i >= 0; i--) {
		if(this.streams[i].cams.indexOf(data["view"]) != -1) {
			if(parent.streams[i].busy) {
				return "STREAM "+i+" IS BUSY IN CONFIGURATIONS";
			}
			parent.streams[i].busy = true;
			if(!_.isUndefined(this.streams[i].source)) {
				// Kill camera feed processes
				try {
					this.streams[i].source.kill('SIGINT');
				} catch(e) {
					console.log(e);
					this.feedback(this.module, "COULD NOT KILL VIDEO FEED: "+e);
					//this.streams[i].source = undefined;
				}
			}
			setTimeout(function() {
				parent.activateCamera(data, i);
				parent.streams[i].busy = false;
			}, 2000);
			return "SWITCHING-VIEW FEED "+i+" TO "+data["view"];
		}
	};

	/*
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
	*/
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
			//'-b', 0,
			//'-vf', 'crop=iw-mod(iw\,2):ih-mod(ih\,2)',
			'http://'+ADDRESS+':'+port+'/destroymit/'+width+'/'+height
		];
		this.caminfo = data;
	}
	return this.cam_args;
};
Video.prototype.activateCamera = function(cam_select, stream_number) {
	var parent = this;
	console.log("Activate camera!");
	try {
		this.streams[stream_number].source = this.process.spawn('ffmpeg', 
			this.genArg(cam_select, this.streams[stream_number].port)
		).on('error', function( err ){ console.log("Oculus could not find FFMpeg or Oculus was not run as superuser!!! ",err); });

		if(this.debug) {
			this.streams[stream_number].source.stdout.on('data', function(out) {
				console.log('stdout: ' + out);
			});
			this.streams[stream_number].source.stderr.on('data', function(err) {
				console.log('stderr: ' + err);
			});	
		}
		this.streams[stream_number].source.on('close', function(code) {
			parent.feedback(parent.module, "VIEW "+cam_select["view"]+" CLOSED, CODE: "+code);
		});
		this.feedback(this.module, "BRINGING UP VIEW "+cam_select["view"]);
	} catch(e) {
		console.log(e);
		this.feedback(this.module, "PROCESS FAILURE STREAM "+stream_number+": "+e);
		//this.mspawn = undefined;
	}
}
Video.prototype.resume = function() {
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
Video.prototype.halt = function() {
	//// Do not halt anything

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

module.exports = exports = Video;