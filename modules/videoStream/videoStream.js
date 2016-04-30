"use strict";

var spawn = require('child_process').spawn;
var readline = require('readline');
var child1;
var child2;
var Neuron = require('../Neuron');
spawn('pkill', ['-9', '-f', '-e', 'ffmpeg']);

class videoStream extends Neuron {
    constructor(util) {
        super(util);
        this.name = util.name;
        this.feedback = util.feedback;
        this.log =utl.color_log;
        this.idle_time = util.idle_timeout;
        this.i2c = util.i2c;
        this.model = util.model;
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
        else if (input.name =='vlcOn') {
            this.vlcOn();
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


    spawnStream1(input) {
        child1 = spawn('ffmpeg', ['-f', 'video4linux2', '-s', '1280x720', '-input_format', 'h264', '-i', '/dev/video-'+input.data.camera, '-vcodec', 'copy', '-an', '-f', 'mpegts', '-copyts', 'udp://127.0.0.1:9000']);
        child1.stdout.on("data", function(data) {
        // console.log("out: " + data.toString("utf8"));
        });
        child1.stderr.on("data", function(data) {
            // console.log("err: " + data.toString("utf8"));
        });
    }

    spawnStream2(input) {
        child2 = spawn('ffmpeg', ['-f', 'video4linux2', '-s', '1280x720', '-input_format', 'h264', '-i', '/dev/video-'+input.data.camera, '-vcodec', 'copy', '-an', '-f', 'mpegts', '-copyts', 'udp://127.0.0.1:9002']);
        child2.stdout.on("data", function(data) { 
        // console.log("out: " + data.toString("utf8"));
        });
        child2.stderr.on("data", function(data) {
            // console.log("err: " + data.toString("utf8"));
        });
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

    vlcOn() {
        function spawnVlc1() {
            var vlcChild1 = spawn('cvlc', ['-v', '--live-caching', '0', 'udp://@:9000', ':sout=#transcode{vcodec=MJPG}:standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:9001}}']);
            vlcChild1.stdout.on("data", function(data) {
                // console.log("out: " + data.toString("utf8"));
            });
            vlcChild1.stderr.on("data", function(data) {
                // console.log("err: " + data.toString("utf8"));
                if (data.toString("utf8").match("invalid sar")) {
                    setTimeout(() => spawnVlc1(), 100);
                }
            });


            vlcChild1.on("exit", function(code) {
                setTimeout(() => spawnVlc1(), 100);
                // console.log("we exited " + code);
            });
        }

        spawnVlc1();

        function spawnVlc2() {
            var vlcChild2 = spawn('cvlc', ['-v', '--live-caching', '0', 'udp://@:9002', ':sout=#transcode{vcodec=MJPG}:standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:9003}}']);
            vlcChild2.stdout.on("data", function(data) {
                // console.log("out: " + data.toString("utf8"));
            });
            vlcChild2.stderr.on("data", function(data) {
                // console.log("err: " + data.toString("utf8"));
                if (data.toString("utf8").match("invalid sar")) {
                    setTimeout(() => spawnVlc2(), 100);
                }
            });


            vlcChild2.on("exit", function(code) {
                setTimeout(() => spawnVlc2(), 100);
                // console.log("we exited " + code);
            });   
        }

        spawnVlc2();
    }
}



module.exports = videoStream;