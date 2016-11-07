"use strict";

describe('Testing Cortex Class', function ()
{
	// =====================================
	// Loading Libraries
	// =====================================
	var Primus = require('primus');
	var http = require('http');
	var fs = require('fs');
	var Cortex = require('../../../modules/Cortex');
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

	describe('Testing #handleMissionControl() Assignment', function ()
	{
		it('Should send assign current connection as Protolobe controller', function (done)
		{
			//// This will send a signal to Cortex to assign this user as the controller of Protolobe.
			connection.write({
				target: "Cortex",
				command: "Protolobe"
			});
			setTimeout(() =>
			{
				expect(cortex.lobe_map["Protolobe"]["controller"]).to.exist;
				done();
			}, 1000);
		});
	});

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
		var status;
		beforeEach(function()
		{
			//// Save status
			status = cortex.lobe_map["Protolobe"].status;
		});
		it('Should send Protolobe status to mission control', function (done)
		{
			var i = 0;
			var possible_states = ["RUNNING", "IDLING", "HALTED"];
			cortex.lobe_map["Protolobe"].state = possible_states[i];
			//// Check that a Primus client can connect with server.
			connection.on('data', (data) =>
			{
				if(possible_states.length === i)
				{
					i++;
					done();
				}
				else if(possible_states.length < i) {}
				else if(data['target'] === "Cortex")
				{
					var message = JSON.parse(data['message']);
					expect(message['Protolobe']['state']).to.equal(possible_states[i]);
					if(message['Protolobe']['state'] === possible_states[i])
					{
						i++;
						cortex.lobe_map["Protolobe"].state = possible_states[i];
					}
				}
			});
		});
		afterEach(function()
		{
			//// Restore status
			cortex.lobe_map["Protolobe"].status = status;
		});
	});

	describe('Testing #handleMissionControl() Controls', function ()
	{
		it('Protolobe state should be HALTED after halt signal sent', function (done)
		{
			//// This will send a signal to Cortex to assign this user as the controller of Protolobe.
			cortex.lobe_map["Protolobe"]._idle();
			connection.write({
				target: "Cortex",
				command: "halt"
			});
			setTimeout(() =>
			{
				expect(cortex.lobe_map["Protolobe"]["state"]).to.equal("HALTED");
				done();
			}, 400);
		});
		it('Protolobe state should be RUNNING after resume signal sent', function (done)
		{
			//// This will send a signal to Cortex to assign this user as the controller of Protolobe.
			cortex.lobe_map["Protolobe"]._idle();
			connection.write({
				target: "Cortex",
				command: "resume"
			});
			setTimeout(() =>
			{
				expect(cortex.lobe_map["Protolobe"]["state"]).to.equal("RUNNING");
				done();
			}, 400);
		});
		it('Protolobe controller should be an empty string when controller disconnects.', function (done)
		{
			expect(cortex.lobe_map["Protolobe"]["controller"]).to.not.be.empty;
			connection.end();
			setTimeout(() =>
			{
				expect(cortex.lobe_map["Protolobe"]["controller"]).to.be.empty;
				done();
			}, 400);
		});
	});
});