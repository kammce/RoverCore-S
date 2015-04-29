"use strict";
//// Video feed Controller

/*
 * Command to stream webcam MPEG1Video to server
	ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b:v 800k -r 20 http://127.0.0.1:9001/destroymit/640/480/
 * Command to view easycap analog video capture with mplayer 
	sudo somagic-capture --secam --iso-transfers=10 --sync=1 | mplayer -nocache -vf yadif -demuxer rawvideo -rawvideo "ntsc:format=uyvy:fps=25"
 * Command to stream easycap analog video capture to server ( will not work! This is a placeholder )
	sudo somagic-capture --secam --iso-transfers=10 --sync=1 | ffmpeg
 */

var Skeleton = require("./skeleton.js");
Audio.prototype = new Skeleton("AUDIO");
Audio.prototype.constructor = Video;

function Audio(feedback) {
	this.feedback = feedback;
	this.audio = {
		low: {
			dev: "hw:1,0",
			bitrate: 400
		},
		high: {
			dev: "hw:2,0",
			bitrate: 400
		}
	};
	this.streams = ["low", "high"];
	this.process = require('child_process');
	this.cam_args = this.genArg({ view: 'off' });
	//this.caminfo = "off";
	this.debug = false; // process debug information
	this.lspawn; // spawn of lower audio process
	this.hspawn; // spawn of higher audio process
	this.schema = {
		"type" : "object",
		"properties" : {
			"stream" : {
				"type" : "string"
			},
			"res" : {
				"type" : "number"
			}
		}
	};
}
Audio.prototype.handle = function(data) {
	var parent = this;
	console.log("Handlin' dat!");
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
				parent.activateCamera(data);
			}, 1000);
			return "SWITCHING-VIEW TO "+data["view"];
		}
	}
	return "FAIL";
};
Audio.prototype.genArg = function(data) {
	if(_.isUndefined(data)) { return this.data_args; }	
	if(_.isObject(data)) {
		var view	= data["view"];
		var dev		= this.videos[view]['dev'];
		var res 	= (_.isNumber(data['res'])) ? data['res'] : this.videos[view]['res'];
		var width 	= (_.isNumber(data['width'])) ? data['width'] : this.videos[view]['width'];
		var height 	= (_.isNumber(data['height'])) ? data['height'] : this.videos[view]['height'];
		var fps 	= (_.isNumber(data['fps'])) ? 25 : ['fps'];
		this.cam_args = [
			'-s', width+'x'+height,
			'-f', 'video4linux2',
			'-i', dev,
			'-f', 'mpeg1video',
			'-b:v', res+'k',
			'-r', '20',
			'http://'+ADDRESS+':9001/destroymit/'+width+'/'+height
		];
		this.caminfo = data;
	}
	return this.cam_args;
};
Audio.prototype.activateCamera = function(caminfo) {
	var parent = this;
	console.log("Activate camera!");
	try {
		this.mspawn = this.process.spawn('ffmpeg', 
			this.genArg(caminfo)
		).on('error', function( err ){ console.log("ffmpeg could not be found... ",err); });

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
		});
		this.feedback(this.module, "BRINGING UP VIEW "+caminfo["view"]);
	} catch(e) {
		console.log(e);
		this.feedback(this.module, "PROCESS FAILURE: "+e);
		this.mspawn = undefined;
	}
}
Audio.prototype.resume = function() {
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
Audio.prototype.halt = function() {
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