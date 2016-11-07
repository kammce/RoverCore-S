"use strict";

var Protolobe = require('../../../modules/Protolobe/Protolobe');

describe('Testing Protolobe Class', function () {
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
		name:"Protolobe",
		feedback: feedback,
		log: log,
		model: model
	};

	var test_lobe = new Protolobe(util);

	describe('Testing Protolobe Methods', function () {
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
	});
});