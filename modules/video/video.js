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

var Skeleton = require("../skeleton.js");
Video.prototype = new Skeleton("VIDEO");
Video.prototype.constructor = Video;

function Video(model_ref, feedback) {
	this.model = model_ref;
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
	this.tspawn; // spawn of tracker process
	this.mspawn = this.process.spawn('ffmpeg', this.cam_args);
	/*
	this.mspawn.stdout.on('data', function(data) {
		console.log('stdout: ' + data);
	});
	this.mspawn.stderr.on('data', function(data) {
		console.log('stderr: ' + data);
	});
	this.mspawn.on('close', function(code) {
		console.log('closing code: ' + code);
	});
	*/
	this.schema = {
		"type" : "object",
		"properties" : {
			"view" : {
				"type" : "string"
			},
			"res" : {
				"type" : "number",
				"optional": true
			},
			"size" : {
				"type" : "number",
				"optional": true
			},
			"fps" : {
				"type" : "number",
				"optional": true
			}
		}
	};
}
Video.prototype.handle = function(data) {
	var parent = this;
	if(!_.isUndefined(this.mspawn)) {
		this.mspawn.kill('SIGINT');
	}
	if(data["view"] == "off") {
		return "OFF";
	}
	if(_.isObject(data)) {
		if(this.cams.indexOf(data["view"]) != -1) {
			setTimeout(function() {
				parent.mspawn = parent.process.spawn('ffmpeg', parent.genArg(data));	
				/*parent.mspawn.stdout.on('data', function(data) {
					console.log('stdout: ' + data);
				});
				parent.mspawn.stderr.on('data', function(data) {
					console.log('stderr: ' + data);
				});*/
				parent.mspawn.on('close', function(code) {
					parent.feedback(this.module, "VIEW "+data["view"]+" CLOSED, CODE: "+code);
				});
				parent.feedback(this.module, "BRINGING UP VIEW "+data["view"]);
			}, 1000);
			return "SWITCHING-VIEW TO "+data["view"];
		}
	}
	return "FAIL";
};
Video.prototype.genCMD = function(data) {
	var cmd = 'ffmpeg';
		cmd += ' -s ' + this.videos[data]['width']+'x'+this.videos[data]['height'];
		cmd += ' -f ' + 'video4linux2';
		cmd += ' -i ' + this.videos[data]['dev'];
		cmd += ' -f ' + 'mpeg1video';
		cmd += ' -b:v ' + this.videos[data]['res'] + 'k';
		cmd += ' -r ' + '20';
		cmd += ' http://'+ADDRESS+':9001/destroymit/'+this.videos[data]['width']+'/'+this.videos[data]['height'];
	return cmd;
};
Video.prototype.genArg = function(data) {
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
	}
	return this.cam_args;
};

Video.prototype.resume = function() {
	// Bring up previous camera
	this.mspawn = this.process.spawn('ffmpeg', this.cam_args);
};
Video.prototype.halt = function() {
	// Kill camera feed processes
	this.mspawn.kill('SIGINT');
};

module.exports = exports = Video;