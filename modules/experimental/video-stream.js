"use strict";

var process = require('child_process');
var videos = {
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
		dev: "/dev/video0",
		width: "640",
		height: "480"
	},
	trac: {
		dev: "/dev/video3",
		width: "800",
		height: "600"
	}
};

/*
var cmd = 'ffmpeg';
	cmd += ' -s ' + videos['hull']['width']+'x'+videos['hull']['height'];
	cmd += ' -f ' + 'video4linux2';
	cmd += ' -i ' + videos['hull']['dev'];
	cmd += ' -f ' + 'mpeg1video';
	cmd += ' -b:v ' + '800k';
	cmd += ' -r ' + '20';
	cmd += ' http://127.0.0.1:9001/destroymit/'+videos['hull']['width']+'/'+videos['hull']['height'];
*/

var mspawn = process.spawn('ffmpeg',
	[
		'-s', videos['hull']['width']+'x'+videos['hull']['height'],
		'-f', 'video4linux2',
		'-i', videos['hull']['dev'],
		'-f', 'mpeg1video',
		'-b:v', '800k',
		'-r', '20',
		'http://127.0.0.1:9001/destroymit/'+videos['hull']['width']+'/'+videos['hull']['height']
	]);
mspawn.on('exit', function (code) {
	console.log('Child process exited with exit code ',code);
});

setInterval(function() {
	console.log("attempting to kill process!");
	//mspawn.stdin.pause();
	mspawn.kill('SIGTERM');
}, 8000);