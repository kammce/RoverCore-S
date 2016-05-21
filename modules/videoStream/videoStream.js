"use strict";

var spawn = require('child_process').spawn;
var readline = require('readline');
var child1;
var child2;
var child3;
var Neuron = require('../Neuron');
spawn('pkill', ['-9', '-f', '-e', 'ffmpeg']);
spawn('ffmpeg', [])

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
    }
    react(input) {
        if (input.name == 'streamOn') {
            if (input.data.stream==1) {
                this.spawnStream1(input);
            }
            if (input.data.stream==2) {
                this.spawnStream2(input);
            }
        }
        else if (input.name =='streamOff') {
            if (input.data.stream==1) {
                this.endStream1(input);
            }
            else if (input.data.stream==2) {
                this.endStream2(input);
            }
        }
        else if (input.name =='audioOn') {
            this.spawnAudio()
        }
        else if (input.name =='audioOff') {
            this.endAudio()
        }
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
    }
    s(input) {
        child1 = spawn('ffmpeg', ['-f', 'video4linux2', '-s', '1280x720', '-input_format', 'h264', '-i', '/dev/video-'+input.data.camera, '-vcodec', 'copy', '-an', '-f', 'mpegts', '-copyts', 'udp://'+this.url.hostname+':9000']);
        child1.stdout.on("data", function(data) {
            // console.log("out: " + data.toString("utf8"));
        });
        child1.stderr.on("data", function(data) {
            // console.log("err: " + data.toString("utf8"));
        });
    }
    spawnStream1(input) {
        if (typeof child1 != "undefined") {
            child1.kill('SIGINT');
        }
        child1 = spawn('ffmpeg', ['-f', 'video4linux2', '-s', '1280x720', '-input_format', 'h264', '-i', '/dev/video-'+input.data.camera, '-vcodec', 'copy', '-an', '-f', 'mpegts', '-copyts', 'udp://'+this.url.hostname+':9000']);
        child1.stdout.on("data", function(data) {
            // console.log("out: " + data.toString("utf8"));
        });
        child1.stderr.on("data", function(data) {
            // console.log("err: " + data.toString("utf8"));
        });
    }
    spawnStream2(input) {
        if (typeof child2 != "undefined") {
            child2.kill('SIGINT');
        }
        child2 = spawn('ffmpeg', ['-f', 'video4linux2', '-s', '1280x720', '-input_format', 'h264', '-i', '/dev/video-'+input.data.camera, '-vcodec', 'copy', '-an', '-f', 'mpegts', '-copyts', 'udp://'+this.url.hostname+':9002']);
        child2.stdout.on("data", function(data) { 
            // console.log("out: " + data.toString("utf8"));
        });
        child2.stderr.on("data", function(data) {
            // console.log("err: " + data.toString("utf8"));
        });
    }
    spawnAudio() {
        child3 = spawn('ffmpeg', ['-re', '-f', 'alsa', '-ac', '2', '-i', 'hw:0,0', '-acodec', 'libmp3lame', '-b:a', '128k', '-vn', '-f', 'rtp', 'rtp://127.0.0.1:9004'])
    }
    endStream1(input) {
        if (child1) {
            child1.kill('SIGINT');
        }
    }
    endStream2(input) {
        if (child2) {
            child2.kill('SIGINT');
        }
    }
    endAudio() {
        if (child3) {
            child3.kill('SIGINT');
        }
    }

}

module.exports = videoStream;
