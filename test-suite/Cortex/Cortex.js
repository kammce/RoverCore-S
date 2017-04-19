"use strict";

var sinon = require('sinon');

describe('Testing Cortex Class', function ()
{
	// =====================================
	// Loading Libraries
	// =====================================
	var Primus = require('primus');
	var http = require('http');
	var fs = require('fs');
	var Cortex = require('../../modules/Cortex');
	var server = http.createServer();
	// =====================================
	// Construct and define Primus client
	// =====================================
	//// Listen on port 9999 at address 0.0.0.0 (which means all local addresses on the machine)
	server.listen(9999);
	//// Create local client socket connection
	var Socket = new Primus.createSocket();
	// =====================================
	// Unit test global variables
	// =====================================
	var connection, cortex, spark;

	describe('Cortex should initialize', function ()
	{
		it('Should connect to RoverCore server on port 9000', function (done)
		{
			connection = Socket('http://localhost:9000', {
				reconnect: {
					max: 2000, //// Number: The max delay before we try to reconnect.
					min: 500, //// Number: The minimum delay before we try reconnect.
					retries: Infinity //// Number: How many times we shoult try to reconnect.
				}
			});
			//// Check that a Primus client can connect with server.
			connection.on('open', () =>
			{
				done();
			});
			//// Setup Cortex configuration structure
			var config = {
				"target": 'http://localhost:9000',
				"connection": undefined,
				"simulate": false,
				"isolation": "Protolobe"
			};
			cortex = new Cortex(config);
		});
		it('#loadLobes should load modules found in modules folder', function(done)
		{
			this.timeout(4000);
			//// Check if protolobe is in the lobe_map
			setTimeout(function()
			{
				expect(cortex.lobe_map["Protolobe"]).to.exist;
				//// Check if protolobe is in the lobe_map
				expect(cortex.lobe_map["Protolobe"].idle_timeout).to.exist;
				done();
			}, 2500);
		});
	});

	// describe('Testing #handleMissionControl() Assignment', function ()
	// {
	// 	it('Should send assign current connection as Protolobe controller', function (done)
	// 	{
	// 		//// This will send a signal to Cortex to assign this user as the controller of Protolobe.
	// 		connection.write({
	// 			target: "Cortex",
	// 			command: "Protolobe"
	// 		});
	// 		setTimeout(() =>
	// 		{
	// 			expect(cortex.lobe_map["Protolobe"]["controller"]).to.exist;
	// 			done();
	// 		}, 1000);
	// 	});
	// });

	describe('Testing #handleIncomingData()', function ()
	{
		var react, halt, resume, idle;
		beforeEach(function()
		{
			//// Save methods
			react = cortex.lobe_map["Protolobe"]._react;
			halt = cortex.lobe_map["Protolobe"]._halt;
			resume = cortex.lobe_map["Protolobe"]._resume;
			idle = cortex.lobe_map["Protolobe"]._idle;
		});
		it('Lobe should receive target data from server', function (done)
		{
			cortex.lobe_map["Protolobe"]._react = function(data)
			{
				expect(data).to.equal("coldfustion");
				done();
			}
			connection.write({
				"target": 'Protolobe',
				"command": 'coldfustion'
			});
		});
		afterEach(function()
		{
			//// Restore methods
			cortex.lobe_map["Protolobe"]._react = react;
			cortex.lobe_map["Protolobe"]._halt = halt;
			cortex.lobe_map["Protolobe"]._resume = resume;
			cortex.lobe_map["Protolobe"]._idle = idle;
		});
	});
	describe('Testing #handleIdleStatus()', function ()
	{
		var react, halt, resume, idle;
		this.timeout(4000);
		beforeEach(function()
		{
			//// Save methods
			react = cortex.lobe_map["Protolobe"]._react;
			halt = cortex.lobe_map["Protolobe"]._halt;
			resume = cortex.lobe_map["Protolobe"]._resume;
			idle = cortex.lobe_map["Protolobe"]._idle;
		});
		it('Should idle Protolobe after 2000ms of time', function (done)
		{
			cortex.lobe_map["Protolobe"].state = "RUNNING";
			connection.write({
				"target": 'Protolobe',
				"command": 'ONLY ONE MESSAGE... SHOULD IDLE SOON.'
			});
			cortex.lobe_map["Protolobe"]._idle = function()
			{
				cortex.lobe_map["Protolobe"].state = "IDLING";
				done();
			}
		});
		it('Should NOT idle Protolobe after 4000ms of time if signal is sent to it', function (done)
		{
			cortex.time_since_last_command["Protolobe"] = Date.now();
			cortex.lobe_map["Protolobe"].state = "RUNNING";
			cortex.lobe_map["Protolobe"]._idle = function()
			{
				throw new Error('Idle was executed!');
			}
			setTimeout(function()
			{
				clearInterval(send_continuously);
				done();
			}, 3000);
			var send_continuously = setInterval(function()
			{
				connection.write({
					"target": 'Protolobe',
					"command": 'STAY UP! DO NOT IDLE!'
				});
			}, 500);
		});
		afterEach(function()
		{
			//// Restore methods
			cortex.lobe_map["Protolobe"]._react = react;
			cortex.lobe_map["Protolobe"]._halt = halt;
			cortex.lobe_map["Protolobe"]._resume = resume;
			cortex.lobe_map["Protolobe"]._idle = idle;
		});
	});
	describe('Testing #sendLobeStatus()', function ()
	{
		var state;
		beforeEach(function()
		{
			//// Save status
			state = cortex.lobe_map["Protolobe"].state;
		});
		it('Should send Protolobe state to mission control', function (done)
		{
			var i = 0;
			var possible_states = ["IDLING", "RUNNING", "HALTED"];
			//// Check that a Primus client can connect with server.
			cortex.lobe_map["Protolobe"].state = possible_states[i];
			connection.on('data', (data) =>
			{
				console.log("I'm getting called :: ", data);
				if(possible_states.length === i)
				{
					i++; //// This keeps the done signal from being called again
					done();
				}
				else if(data['target'] === "Cortex" && i < possible_states.length)
				{
					var message = JSON.parse(data['message']);
					expect(message['lobe']).to.equal('Protolobe');
					expect(message['state']).to.equal(possible_states[i]);
					cortex.lobe_map["Protolobe"].state = possible_states[++i];
					console.log("=====================");
					console.log(message);
					console.log(cortex.lobe_map["Protolobe"].state);
					console.log("=====================");
				}
			});
		});
		afterEach(function()
		{
			//// Restore status
			cortex.lobe_map["Protolobe"].state = state;
		});
	});

	describe('Testing #handleMissionControl() Controls', function ()
	{
		it('Protolobe state should be HALTED after halt signal sent', function (done)
		{
			//// Reset the timer
			cortex.time_since_last_command["Protolobe"] = Date.now();
			//// Set lobe as idle
			cortex.lobe_map["Protolobe"]._idle();
			connection.write({
				target: "Cortex",
				command:
				{
					lobe: "Protolobe",
					action: "halt"
				}
			});
			setTimeout(() =>
			{
				expect(cortex.lobe_map["Protolobe"]["state"]).to.equal("HALTED");
				done();
			}, 1000);
		});
		it('Protolobe state should be RUNNING after resume signal sent', function (done)
		{
			//// Reset the timer
			cortex.time_since_last_command["Protolobe"] = Date.now();
			//// Set lobe as idle
			cortex.lobe_map["Protolobe"]._idle();
			connection.write({
				target: "Cortex",
				command:
				{
					lobe: "Protolobe",
					action: "resume"
				}
			});
			setTimeout(() =>
			{
				expect(cortex.lobe_map["Protolobe"]["state"]).to.equal("RUNNING");
				done();
			}, 1000);
		});
		// it('Protolobe controller should be an empty string when controller disconnects.', function (done)
		// {
		// 	expect(cortex.lobe_map["Protolobe"]["controller"]).to.not.be.empty;
		// 	connection.end();
		// 	setTimeout(() =>
		// 	{
		// 		expect(cortex.lobe_map["Protolobe"]["controller"]).to.be.empty;
		// 		done();
		// 	}, 1000);
		// });
	});

	describe('Testing direct #upcall("*ALL") state control', function ()
	{
		it('#upcall("HALTALL") should halt all modules', function ()
		{
			cortex.upcall("HALTALL");
			for(var lobes in cortex.lobe_map)
			{
				expect(cortex.lobe_map[lobes].state).to.equal("HALTED");
			}
		});
		it('#upcall("IDLEALL") should halt all modules', function ()
		{
			cortex.upcall("IDLEALL");
			for(var lobes in cortex.lobe_map)
			{
				expect(cortex.lobe_map[lobes].state).to.equal("IDLING");
			}
		});
		it('#upcall("RESUMEALL") should halt all modules', function ()
		{
			cortex.upcall("RESUMEALL");
			for(var lobes in cortex.lobe_map)
			{
				expect(cortex.lobe_map[lobes].state).to.equal("RUNNING");
			}
		});
	});

	describe('Testing direct #upcall("CALL") call', function ()
	{
		var spy;
		const upcall_command = "VIA-UPCALL";
		const upcall_loopback = "LOOPBACK-UPCALL";
		before(function()
		{
			spy = sinon.spy(cortex.lobe_map["Protolobe"], "react");
			spy.withArgs(upcall_command);
			spy.withArgs(upcall_loopback);
		});
		it('#upcall("CALL", "Protolobe", "VIA-UPCALL") should halt all modules', function (done)
		{
			cortex.upcall("CALL", "Protolobe", upcall_command);
			setTimeout(function() {
				expect(cortex.lobe_map["Protolobe"].react.calledWith(upcall_command)).to.be.true;
				done();
			}, 200);
		});
		it('Protolobe should run #upcall("CALL", "Protolobe", "VIA-UPCALL") when halted', function (done)
		{
			//// Protolobe is setup to do a self upcall when resume is called for testing purposes
			cortex.lobe_map["Protolobe"]._resume();
			setTimeout(function() {
				expect(cortex.lobe_map["Protolobe"].react.calledWith(upcall_loopback)).to.be.true;
				done();
			}, 200);
		});
		after(function()
		{
			spy.restore();
		});
	});
});