"use strict";
//// Video feed Controller

var Skeleton = require("../skeleton.js");
Video.prototype = new Skeleton("Video");
Video.prototype.constructor = Video;

function Video(model_ref) {
	this.model = model_ref;
	this.videos = {
		navi: {
			dev: "/dev/video0",
			width: "864",
			height: "480"
		},
		arm: {
			dev: "/dev/video0",
			width: "640",
			height: "480"
		},
		hull: { 
			dev: "/dev/video0",
			width: "640",
			height: "480"
		},
		trac: {
			dev: "/dev/video0",
			width: "800",
			height: "600"
		}
	};
	this.process = require('child_process');
	this.tspawn;
	this.mspawn = this.process.spawn('ffmpeg', this.genArg('hull'));
}
Video.prototype.handle = function(data) {
	var parent = this;
	console.log(this.module+" Recieved ", data);
	if(typeof this.mspawn != "undefined") {
		this.mspawn.kill('SIGTERM');
	}	
	//ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b:v 800k -r 20 http://127.0.0.1:9001/destroymit/640/480/
	setTimeout(function() {
		parent.mspawn = parent.process.spawn('ffmpeg', parent.genArg(data));
	}, 100);
};
Video.prototype.genCMD = function(data) {
	var cmd = 'ffmpeg';
		cmd += ' -s ' + this.videos[data]['width']+'x'+this.videos[data]['height'];
		cmd += ' -f ' + 'video4linux2';
		cmd += ' -i ' + this.videos[data]['dev'];
		cmd += ' -f ' + 'mpeg1video';
		cmd += ' -b:v ' + '800k';
		cmd += ' -r ' + '20';
		cmd += ' http://127.0.0.1:9001/destroymit/'+this.videos[data]['width']+'/'+this.videos[data]['height'];
	return cmd;
};

Video.prototype.genArg = function(data) {
	return [
		'-s', this.videos[data]['width']+'x'+this.videos[data]['height'],
		'-f', 'video4linux2',
		'-i', this.videos[data]['dev'],
		'-f', 'mpeg1video',
		'-b:v', '800k',
		'-r', '20',
		'http://127.0.0.1:9001/destroymit/'+this.videos[data]['width']+'/'+this.videos[data]['height']
	];
};

Video.prototype.resume = function() {};
Video.prototype.halt = function() {};

module.exports = exports = Video;