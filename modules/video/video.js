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
			dev: "/dev/video1",
			width: "640",
			height: "480"
		},
		hull: { 
			dev: "/dev/video2",
			width: "640",
			height: "480"
		},
		trac: {
			dev: "/dev/video3",
			width: "800",
			height: "600"
		}
	};
	this.process = require('child_process');
	this.tspawn;
	this.mspawn = process.spawn('ffmpeg', [
		'-s '+this.videos['navi']['width']+'x'+this.videos['navi']['height'], 
		'-f video4linux2', 
		'-i '+this.videos['navi']['dev'], 
		'-f mpeg1video',
		'-b:v 800k',
		'-r 20' 
		'http://127.0.0.1:9001/destroymit/'+this.videos['navi']['width']+'/'+this.videos['navi']['height']
	]);
}
Video.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
	if(typeof this.mspawn != "undefined") {
		this.mspawn.stdin.pause();
		this.mspawn.kill();
	}	
	//ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b:v 800k -r 20 http://127.0.0.1:9001/destroymit/640/480/
	this.mspawn = process.spawn('ffmpeg', [
		'-s '+this.videos[data]['width']+'x'+this.videos[data]['height'], 
		'-f video4linux2', 
		'-i '+this.videos[data]['dev'], 
		'-f mpeg1video',
		'-b:v 800k',
		'-r 20' 
		'http://127.0.0.1:9001/destroymit/'+this.videos[data]['width']+'/'+this.videos[data]['height']
	]);
};
Video.prototype.resume = function() {};
Video.prototype.halt = function() {};

module.exports = exports = Video;