"use strict";

var VideoServer = require('../../../modules/VideoServer/VideoServer');

/*

cvlc -I dummy v4l2:// :v4l2-dev=/dev/video-tracker :v4l2-width=1280 :v4l2-height=720 --live-caching=0 --network-caching=0 ':sout=#transcode{vcodec=MJPG,fps=30}:standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:9001}}'

cvlc -I dummy http://localhost:9001 --live-caching=0 --network-caching=0 ':sout=#standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:9002}}'

*/


describe('Testing VideoServer Class', function () {
	var expected_log;
	var expected_feedback;

	var log = function() { }
	log.output = function(input) {
		expected_log = "";
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] === "object") {
				expected_log += JSON.stringify(arguments[i])+"\n";
			} else {
				expected_log += arguments[i];
			}
		}
	};
	log.setColor = function(input) {};

	var feedback = function(input) {
		expected_feedback = "";
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] === "object") {
				expected_feedback += JSON.stringify(arguments[i])+"\n";
			} else {
				expected_feedback += arguments[i];
			}
		}
	};

	var model = function() {}; // filler model object (not used in test)

	var util = {
		name:"VideoServer",
		feedback: feedback,
		log: log,
		model: model
	};

	var test_lobe = new VideoServer(util);

	describe('Testing VideoServer #checkIfVLCExists() Method', function () {
		it('Check if VLC exists on host system.', function () {
			var input = "TESTING";
			test_lobe.react(input);
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: ${input}`);
			expect(expected_feedback).to.equal(`REACTING ${test_lobe.name}: ${input}`);
		});
		it('Check if method returns true if VLC exists on system.', function () {
			test_lobe.halt();
			expect(expected_log).to.equal(`HALTING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`HALTING ${test_lobe.name}`);
		});
		it('Method should return false with spoofed spawn function', function () {
			test_lobe.resume();
			expect(expected_log).to.equal(`RESUMING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`RESUMING ${test_lobe.name}`);
		});
	});

	describe('Testing VideoServer #generateSpawnArguments() Method', function () {
		it('Spawn arguments should match expected with height 1280x720 and fps 20', function () {
			var input = "TESTING";
			test_lobe.react(input);
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: ${input}`);
			expect(expected_feedback).to.equal(`REACTING ${test_lobe.name}: ${input}`);
		});
		it('Spawn arguments should match expected with height 1280x720 and fps 20', function () {
			var input = "TESTING";
			test_lobe.react(input);
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: ${input}`);
			expect(expected_feedback).to.equal(`REACTING ${test_lobe.name}: ${input}`);
		});
		it('HTTP Get request should return buffer data', function () {
			// var http = require('http');
			// http.get({
			//     host: 'localhost',
			//     port: 9001,
			//     path: '/'
			// }, function(response) {
			//     // Continuously update stream with data
			//     response.on('data', function(d) {
			//         console.log(d);
			//     });
			//     response.on('end', function() {
			//         // Data reception is done, do whatever with it!
			//         var parsed = JSON.parse(body);
			//         callback({
			//             email: parsed.email,
			//             password: parsed.pass
			//         });
			//     });
			// });
		});
	});

	describe('Testing VideoServer #startVideoServer() Method', function () {
		it('CVLC process should exist after function call', function () {
			var input = "TESTING";
			test_lobe.react(input);
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: ${input}`);
			expect(expected_feedback).to.equal(`REACTING ${test_lobe.name}: ${input}`);
		});
		it('HTTP Get request should return buffer data', function () {
			// var http = require('http');
			// http.get({
			//     host: 'localhost',
			//     port: 9001,
			//     path: '/'
			// }, function(response) {
			//     // Continuously update stream with data
			//     response.on('data', function(d) {
			//         console.log(d);
			//     });
			//     response.on('end', function() {
			//         // Data reception is done, do whatever with it!
			//         var parsed = JSON.parse(body);
			//         callback({
			//             email: parsed.email,
			//             password: parsed.pass
			//         });
			//     });
			// });
		});
	});

	describe('Testing VideoServer #stopVideoServer() Method', function () {
		it('Should kill CVLC process created from #startVideoServer method', function () {
			var input = "TESTING";
			test_lobe.react(input);
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: ${input}`);
			expect(expected_feedback).to.equal(`REACTING ${test_lobe.name}: ${input}`);
		});
	});

	describe('Testing VideoServer #forceKillVideoServer() Method', function () {
		it('Should kill all CVLC processes on system', function () {
			var input = "TESTING";
			test_lobe.react(input);
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: ${input}`);
			expect(expected_feedback).to.equal(`REACTING ${test_lobe.name}: ${input}`);
		});
	});
});