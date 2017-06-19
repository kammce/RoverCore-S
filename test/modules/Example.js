"use strict";

var INSERT_LOBE_NAME_HERE = require("Protolobe/Protolobe");

describe("Testing INSERT_LOBE_NAME_HERE Class", function()
{
	var util = require("test_lobe_utilities");

	var test_unit = new INSERT_LOBE_NAME_HERE(util);

	describe("Testing Lobe Methods", function()
	{
		it("#react() test here", function()
		{
			test_unit.react();
			expect(true).to.be.true;
		});
		it("#halt() test here", function()
		{
			test_unit.halt();
			expect(true).to.be.true;
		});
		it("#resume() test here", function()
		{
			test_unit.resume();
			expect(true).to.be.true;
		});
		it("#idle() test here", function()
		{
			test_unit.idle();
			expect(true).to.be.true;
		});
		it("#additionalMethod() test here", function()
		{
			expect(true).to.be.true;
		});
	});
});
