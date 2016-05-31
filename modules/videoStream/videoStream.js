"use strict";

var spawn = require('child_process').spawn;
const exec = require('child_process').exec;
var Neuron = require('../Neuron');
spawn('pkill', ['-9', '-f', '-e', 'ffmpeg']);

class videoStream extends Neuron {
	constructor(util) {
		super(util);
		this.name = util.name;
		this.feedback = util.feedback;
		this.log = util.log;
		this.idle_time = util.idle_timeout;
		this.i2c = util.i2c;
		this.model = util.model;
		this.url = util.url;
		// Construct Class here
		this.video_streams = [];
		this.audio_stream;
	}
	react(input) {
		if (input.name === 'streamOn') {
			this.spawnStream(input);
		}
		else if (input.name === 'streamOff') {
			this.endStream(input);
		}
		else if (input.name === 'audioOn') {
			this.spawnAudio();
		}
		else if (input.name === 'audioOff') {
			this.endAudio();
		}
		else if(input.name === 'zoom') {
			if(typeof input.data.zoom === "number") {
				exec(`${__dirname}/Khalil-CameraAPI/camera-control ${input.data.zoom}`, (error, stdout, stderr) => {
					// if (error) {
					//   console.error(`exec error: ${error}`);
					//   return;
					// }
					// console.log(`stdout: ${stdout}`);
					// console.log(`stderr: ${stderr}`);
				});
			}
		}
	}
	halt() {}
	resume() {}
	idle() {}
	spawnStream(input) {
		if (typeof this.video_streams[input.data.stream] !== "undefined") {
			this.video_streams[input.data.stream].kill('SIGINT');
		}
		switch(input.data.camera) {
			case "science":
			case "tracker":
				var tracker_stream = input.data.stream;
				var args = [
					'-f', 'video4linux2',
					'-s', '1280x720',
					'-i', `/dev/video-${input.data.camera}`,
					'-vcodec', 'mjpeg',
					'-an',
					'-q', '0',
					'-r', '20',
					'-f', 'mjpeg',
					'-s', '1280x720',
					`udp://${this.url.hostname}:${9001+((tracker_stream-1)*2)}`
				];

				this.video_streams[tracker_stream] = spawn('ffmpeg', args);
				// Because the tracker has the tendancy to NOT supply enough data per frame
				// ffmpeg closes. This listener will restart ffmpeg when it closes on its own.
				this.video_streams[tracker_stream].on('exit', (code) => {
					this.log.output("Restarting tracker video!", code);
					//this.video_streams[tracker_stream] = spawn('ffmpeg', args);
					// this will restart tracker
					if(code !== 255) {
						this.spawnStream(input);
					}
				});
				break;
			case "claw":
				this.video_streams[input.data.stream] = spawn('ffmpeg', [
					'-f', 'video4linux2',
					'-r', '20',
					'-s', '1280x720',
					'-input_format', 'mjpeg',
					'-i', '/dev/video-claw',
					'-vcodec', 'copy',
					'-an',
					'-q', '0',
					'-f', 'mjpeg',
					`udp://${this.url.hostname}:${9001+((input.data.stream-1)*2)}`
				]);
				break;
			case "killall":
				spawn('pkill', ['-9', '-f', '-e', 'ffmpeg']);
				this.video_streams = [];
				return;
				break;
			default:
				this.video_streams[input.data.stream] = spawn('ffmpeg', [
					'-f', 'video4linux2',
					'-s', '1280x720',
					'-input_format', 'h264',
					'-i', `/dev/video-${input.data.camera}`,
					'-vcodec', 'copy',
					'-an',
					'-f', 'mpegts',
					'-copyts',
					`udp://${this.url.hostname}:${9001+((input.data.stream-1)*2)}`
				]);
				break;
		}
		this.video_streams[input.data.stream].stdout.on('data', (data) => {
		  //console.log(`stdout: ${data}`);
		});
		this.video_streams[input.data.stream].stderr.on('data', (data) => {
		  //console.log(`stderr: ${data}`);
		});
	}
	spawnAudio() {
		this.audio_stream = spawn('sh', [ `${__dirname}/audio-script.sh`, this.url.hostname ]);
		this.audio_stream.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`);
		});
		this.audio_stream.stderr.on('data', (data) => {
		  console.log(`stderr: ${data}`);
		});
	}
	endStream(input) {
		if (typeof this.video_streams[input.data.stream] !== "undefined") {
			this.video_streams[input.data.stream].kill('SIGINT');
		}
	}
	endAudio() {
		if (typeof this.audio_stream !== "undefined") {
			exec("pkill -f 'arecord -f cd -D hw:CARD=C920'");
		}
	}
}

module.exports = videoStream;
