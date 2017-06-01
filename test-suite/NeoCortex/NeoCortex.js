"use strict";

var NeoCortex = require('../../modules/NeoCortex/NeoCortex');
var Model = require('../../utilities/Model');


describe('Testing NeoCortex Class', function () {
	this.timeout(3000);
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

    var model = new Model(function() {});
	//var model = function() {}; // filler model object (not used in test)

	var util = {
		name:"NeoCortex",
		feedback: feedback,
		log: log,
		model: model,
		upcall: () => {}
	};

	var test_lobe = new NeoCortex(util);

	describe('Testing NeoCortex Methods', function () {
		it('#react() should be called', function () {
			var input = "TESTING";
			test_lobe.react(input);
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: ${input}`);
			expect(expected_feedback).to.equal(`REACTING ${test_lobe.name}: ${input}`);
		});
		it('#halt() should be called', function () {
			test_lobe.halt();
			expect(expected_log).to.equal(`HALTING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`HALTING ${test_lobe.name}`);
		});
		it('#resume() should be called', function () {
			test_lobe.resume();
			expect(expected_log).to.equal(`RESUMING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`RESUMING ${test_lobe.name}`);
		});
		it('#idle() should be called', function () {
			test_lobe.idle();
			expect(expected_log).to.equal(`IDLING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`IDLING ${test_lobe.name}`);
		});

		it('#execDrive() should be called', function () {
			var test = test_lobe.execDrive("L");
			expect(test).to.equal("Left");
		});

		it('#headingGPS(0,0,10,10) should be called', function () {
			var test = test_lobe.headingGPS(0,0,10,10);
			expect(test).to.equal(44.561);
		});

		it('#distanceGPS(0,0,10,10) should be called', function () {
			var test = test_lobe.distanceGPS(10.0001,10.0001,10,10);
			expect(test).to.equal(15.624);
		});


	});
});