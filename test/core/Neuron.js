"use strict";

var Neuron = require("../../modules/Neuron");

describe("Testing Neuron Class", function()
{
    var color_log = function() {};
    color_log.output = function() {};

    var util = {
        "name": "unit_test",
        "log": color_log,
        feedback() {},
        model() {},
        upcall() {},
        extended() {}
    };

    var test_unit = new Neuron(util);

    describe("#_halt()", function()
    {
        it("Assert that function will return 'UNDEF' if halt is null.", function()
        {
            test_unit.halt = null;
            expect(test_unit._halt()).to.equal("UNDEF");
        });
        it("Create stub idle function, assert that function returns true for a defined function.", function()
        {
            test_unit.halt = function()
            {
                return true;
            };
            expect(test_unit._halt()).to.be.true;
            expect(test_unit.state).to.equal("HALTED");
        });
    });
    describe("#_resume()", function()
    {
        it("Assert that function will return 'UNDEF' if resume is null.", function()
        {
            test_unit.resume = null;
            expect(test_unit._resume()).equal("UNDEF");
        });
        it("Create stub resume function, assert that function returns true for a defined function.", function()
        {
            test_unit.resume = function()
            {
                return true;
            };
            expect(test_unit._resume()).to.be.true;
            expect(test_unit.state).to.equal("RUNNING");
        });
    });
    describe("#_idle()", function()
    {
        it("Assert that function will return 'UNDEF' if idle is null.", function()
        {
            test_unit.idle = null;
            expect(test_unit._idle()).to.equal("UNDEF");
        });
        it("Create stub idle function, assert that function returns true for a defined function.", function()
        {
            test_unit.idle = function()
            {
                return true;
            };
            expect(test_unit._idle()).to.be.true;
            expect(test_unit.state, "IDLING");
        });
    });
    describe("#_react()", function()
    {
        it("Assert that method will return 'UNDEF' if react is null.", function()
        {
            test_unit.react = null;
            // Inserted parameter to prove that UNDEF
            // only occurs when react is null and
            // not based on input parameter.
            expect(test_unit._react("input")).to.equal("UNDEF");
        });
        // it("Assert that method will return 'NO-ACTION' when given an undefined or null input.", function()
        // {
        //     test_unit.react = function()
        //     {
        //         return "REACT-RAN-WHEN-IT-SHOULD-NOT-HAVE!";
        //     };
        //     expect(test_unit._react()).to.equal("NO-ACTION");
        //     expect(test_unit._react(null)).to.equal("NO-ACTION");
        // });
        it("Assert that method will return 'NO-ACTION' if halted.", function()
        {
            test_unit.halt = function()
            {
                return true;
            };
            test_unit._halt();
            test_unit.react = function()
            {
                return "REACT-RAN-WHEN-IT-SHOULD-NOT-HAVE!";
            };
            expect(test_unit._react("input")).to.equal("NO-ACTION");
        });
        it("Assert that method will return true given a stub react function and adequate input.", function()
        {
            test_unit.resume = function()
            {
                return true;
            };
            test_unit._resume();
            test_unit.react = function()
            {
                return true;
            };
            expect(test_unit._react("input")).to.be.true;
        });
    });
});
