"use strict";

var Protolobe = require("Protolobe/Protolobe");

describe("Testing Protolobe Class", function()
{
	var util = require("test_lobe_utilities");

	var test_lobe = new Protolobe(util);

	var log_spy = sinon.spy(test_lobe.log, "output");
	var feedback_spy = sinon.spy(test_lobe, "feedback");

	describe("Testing Protolobe Methods", function()
	{
		it("#react() should be called", function()
		{
			var input = "TESTING";

			test_lobe.react(input);

			expect(log_spy.calledWith(`REACTING ${test_lobe.name}: `, input)).to.be.true;
			expect(feedback_spy.calledWith(`REACTING ${test_lobe.name}: `, input)).to.be.true;
		});
		it("#halt() should be called", function()
		{
			test_lobe.halt();

			expect(log_spy.calledWith(`HALTING ${test_lobe.name}`)).to.be.true;
			expect(feedback_spy.calledWith(`HALTING ${test_lobe.name}`)).to.be.true;
		});
		it("#resume() should be called", function()
		{
			test_lobe.resume();

			expect(log_spy.calledWith(`RESUMING ${test_lobe.name}`)).to.be.true;
			expect(feedback_spy.calledWith(`RESUMING ${test_lobe.name}`)).to.be.true;
		});
		it("#idle() should be called", function()
		{
			test_lobe.idle();

			expect(log_spy.calledWith(`IDLING ${test_lobe.name}`)).to.be.true;
			expect(feedback_spy.calledWith(`IDLING ${test_lobe.name}`)).to.be.true;
		});
	});
});
