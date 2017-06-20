"use strict";

var sinon = require("sinon");

describe("Testing Cortex Class", function()
{
	// =====================================
	// Loading Libraries
	// =====================================
	var Primus = require("primus");
	var http = require("http");
	var Cortex = require("Cortex");
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
	var connection, cortex;

	describe("Cortex should initialize", function()
	{
		it("Should connect to RoverCore server on port 9000", function(done)
		{
			connection = Socket("http://localhost:9000",
			{
				reconnect:
				{
					max: 2000, //// Number: The max delay before we try to reconnect.
					min: 500, //// Number: The minimum delay before we try reconnect.
					retries: Infinity //// Number: How many times we shoult try to reconnect.
				}
			});
			//// Check that a Primus client can connect with server.
			connection.on("open", () =>
			{
				done();
			});
			//// Setup Cortex configuration structure
			var config = {
				"target": "http://localhost:9000",
				"connection": undefined,
				"simulate": false,
				"isolation": "Protolobe",
				"debug_level": 0,
				"no_color": false,
				"under_test": true
			};
			cortex = new Cortex(config);
		});
		it("#loadLobes should load modules found in modules folder", function(done)
		{
			this.timeout(1000);
			//// Check if protolobe is in the lobe_map
			setTimeout(function()
			{
				expect(cortex.lobe_map["Protolobe"]).to.exist;
				//// Check if protolobe is in the lobe_map
				expect(cortex.lobe_map["Protolobe"].idle_timeout).to.exist;
				done();
			}, 750);
		});
		it("Running #loadLobes with an isolation of '' should make it attempt to end the RoverCore process", function()
		{
			var process_exit_stub = sinon.stub(process, "exit");
			cortex.loadLobes("");
			expect(process_exit_stub.called).to.be.true;
			process_exit_stub.restore();
		});
	});

	describe("Testing #handleIncomingData()", function()
	{
		var spy, stub;
		before(function()
		{
			spy = sinon.spy(cortex, "handleIncomingData");
			stub = sinon.stub(cortex.lobe_map["Protolobe"], "_react");
		});
		it("Lobe should receive target data from server", function(done)
		{
			stub.callsFake(function(data)
			{
				expect(data).to.equal("coldfustion");
				expect(spy.returnValues[0]).to.be.true;
				done();
			});
			connection.write(
			{
				"target": "Protolobe",
				"command": "coldfustion"
			});
		});
		it("Should return false with invalid lobe given", function(done)
		{
			connection.write(
			{
				"target": "LOBE_NAME_THAT_DOES_NOT_EXIST",
				"command": "coldfustion"
			});

			setTimeout(function()
			{
				expect(spy.returnValues[0]).to.be.false;
				done();
			}, 200);
		});
		afterEach(function()
		{
			spy.reset();
		});
		after(function()
		{
			spy.restore();
			stub.restore();
		});
	});
	describe("Testing #handleIdleStatus()", function()
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
		it("Should idle Protolobe after 2000ms of time", function(done)
		{
			cortex.lobe_map["Protolobe"].state = "RUNNING";
			connection.write(
			{
				"target": "Protolobe",
				"command": "ONLY ONE MESSAGE... SHOULD IDLE SOON."
			});
			cortex.lobe_map["Protolobe"]._idle = function()
			{
				cortex.lobe_map["Protolobe"].state = "IDLING";
				done();
			};
		});
		it("Should NOT idle Protolobe after 4000ms of time if signal is sent to it", function(done)
		{
			cortex.time_since_last_command["Protolobe"] = Date.now();
			cortex.lobe_map["Protolobe"].state = "RUNNING";
			cortex.lobe_map["Protolobe"]._idle = function()
			{
				throw new Error("Idle was executed!");
			};
			var send_continuously = setInterval(function()
			{
				connection.write(
				{
					"target": "Protolobe",
					"command": "STAY UP! DO NOT IDLE!"
				});
			}, 500);

			setTimeout(function()
			{
				clearInterval(send_continuously);
				done();
			}, 3000);
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
	describe("Testing #sendLobeStatus()", function()
	{
		var state;
		beforeEach(function()
		{
			//// Save status
			state = cortex.lobe_map["Protolobe"].state;
		});
		it("Should send Protolobe state to mission control", function(done)
		{
			var i = 0;
			var possible_states = ["IDLING", "RUNNING", "HALTED"];
			//// Check that a Primus client can connect with server.
			cortex.lobe_map["Protolobe"].state = possible_states[i];
			connection.on("data", (data) =>
			{
				//console.log("I"m getting called :: ", data);
				if (possible_states.length === i)
				{
					i++; //// This keeps the done signal from being called again
					done();
				}
				else if (data["target"] === "Cortex" && i < possible_states.length)
				{
					//console.log(data["message"]);

					var message = JSON.parse(data["message"]);

					expect(message.data).to.include.keys("Protolobe");
					expect(message.data["Protolobe"].state).to.equal(possible_states[i]);

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

	describe("Testing #sendInterfaceStatus()", function()
	{
		var spy;
		before(function()
		{
			spy = sinon.spy(cortex, "feedback");
		});
		it("Should use feedback to send mission controllers when called", function()
		{
			cortex.sendInterfaceStatus();
			expect(spy.calledWith({
				type: "mission_controllers",
				data: cortex.mission_controllers
			})).to.be.true;
		});
		after(function()
		{
			spy.restore();
		});
	});

	describe("Testing #addInterface()", function()
	{
		before(function()
		{
			delete cortex.mission_controllers.Protolobe;
		});
		it("Should insert id 'XXX' into property 'Protolobe' after call ", function()
		{
			cortex.addInterface("Protolobe", {id: "XXX"});
			expect(cortex.mission_controllers["Protolobe"]).to.equal("XXX");
		});
		after(function()
		{
			delete cortex.mission_controllers.Protolobe;
		});
	});

	describe("Testing #removeInterface()", function()
	{
		before(function()
		{
			cortex.mission_controllers.Protolobe = "XXX";
		});
		it("Should insert id 'XXX' into property 'Protolobe' after call ", function()
		{
			expect(cortex.mission_controllers["Protolobe"]).to.equal("XXX");
			cortex.removeInterface({id: "XXX"});
			expect(cortex.mission_controllers["Protolobe"]).to.be.empty;
		});
		after(function()
		{
			delete cortex.mission_controllers.Protolobe;
		});
	});

	describe("Testing #handleMissionControl()", function()
	{
		before(function()
		{
			delete cortex.mission_controllers.Protolobe;
		});
		it("Should add interface to mission_controllers when given parameters { controller: 'Protolobe' }, and spark { id: 'XXX' }", function()
		{
			cortex.handleMissionControl({ controller: 'Protolobe' }, { id: "XXX" });
			expect(cortex.mission_controllers["Protolobe"]).to.equal("XXX");
		});
		it("Should remove interface when given parameters 'disconnect', and a spark", function()
		{
			cortex.handleMissionControl("disconnect", { id: "XXX" });
			expect(cortex.mission_controllers["Protolobe"]).to.be.empty;
		});
		after(function()
		{
			delete cortex.mission_controllers.Protolobe;
		});
	});

	describe("Testing direct #upcall('*ALL') state control", function()
	{
		var exec_stub, process_exit_stub;
		before(function()
		{
			exec_stub = sinon.stub(cortex, "exec");
			process_exit_stub = sinon.stub(process, "exit");
		});
		it("#upcall('HALTALL') should halt all modules", function()
		{
			cortex.upcall("HALTALL");
			for (var lobes in cortex.lobe_map)
			{
				expect(cortex.lobe_map[lobes].state).to.equal("HALTED");
			}
		});
		it("#upcall('IDLEALL') should halt all modules", function()
		{
			cortex.upcall("IDLEALL");
			for (var lobes in cortex.lobe_map)
			{
				expect(cortex.lobe_map[lobes].state).to.equal("IDLING");
			}
		});
		it("#upcall('RESUMEALL') should halt all modules", function()
		{
			cortex.upcall("RESUMEALL");
			for (var lobes in cortex.lobe_map)
			{
				expect(cortex.lobe_map[lobes].state).to.equal("RUNNING");
			}
		});
		it("#upcall('SYSTEM-SHUTDOWN') should run exec with 'shutdown -h now'", function()
		{
			cortex.upcall('SYSTEM-SHUTDOWN');
			expect(exec_stub.calledWith("shutdown -h now")).to.be.true;
		});
		it("#upcall('SYSTEM-RESTART') should run exec with 'reboot'", function()
		{
			cortex.upcall('SYSTEM-RESTART');
			expect(exec_stub.calledWith("reboot")).to.be.true;
		});
		it("#upcall('RESTART-CORTEX') run process.exit(0)", function()
		{
			cortex.upcall('RESTART-CORTEX');
			expect(process_exit_stub.calledWith(0)).to.be.true;
		});
		after(function()
		{
			exec_stub.restore();
			process_exit_stub.restore();
		});
	});

	describe("Testing direct #upcall('CALL') call", function()
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
		it("#upcall('CALL', 'Protolobe', 'VIA-UPCALL') should halt all modules", function(done)
		{
			cortex.upcall("CALL", "Protolobe", upcall_command);
			setTimeout(function()
			{
				expect(cortex.lobe_map["Protolobe"].react.calledWith(upcall_command)).to.be.true;
				done();
			}, 200);
		});
		it("Protolobe should run #upcall('CALL', 'Protolobe', 'VIA-UPCALL') when halted", function(done)
		{
			//// Protolobe is setup to do a self upcall when resume is called for testing purposes
			cortex.lobe_map["Protolobe"]._resume();
			setTimeout(function()
			{
				expect(cortex.lobe_map["Protolobe"].react.calledWith(upcall_loopback)).to.be.true;
				done();
			}, 200);
		});
		after(function()
		{
			spy.restore();
		});
	});

	describe("Testing Primus 'connection' event callback", function()
	{
		var stub_handle_mission_control, stub_handle_incoming_data;
		beforeEach(function()
		{
			stub_handle_mission_control = sinon.stub(cortex, "handleMissionControl");
			stub_handle_incoming_data = sinon.stub(cortex, "handleIncomingData");
		});
		it("Should call #handleMissionControl() when target is 'Cortex'", function(done)
		{
			connection.write(
			{
				"target": "Cortex",
				"command": "EMPTY_COMMAND"
			});
			setTimeout(function()
			{
				expect(stub_handle_mission_control.called).to.be.true;
				expect(stub_handle_incoming_data.called).to.be.false;
				done();
			}, 200);
		});
		it("Should call #handleIncomingData() when target is not 'Cortex'", function(done)
		{
			connection.write(
			{
				"target": "Protolobe",
				"command": "EMPTY_COMMAND"
			});
			setTimeout(function()
			{
				expect(stub_handle_mission_control.called).to.be.false;
				expect(stub_handle_incoming_data.called).to.be.true;
				done();
			}, 200);
		});
		it("Should call neither #handleIncomingData() #handleMissionControl with invalid structure", function(done)
		{
			connection.write({});
			setTimeout(function()
			{
				expect(stub_handle_mission_control.called).to.be.false;
				expect(stub_handle_incoming_data.called).to.be.false;
				done();
			}, 200);
		});
		it("Should call #handleIncomingData() when target is not 'Cortex'", function(done)
		{
			stub_handle_incoming_data.callsFake(function()
			{
				throw new Error("CATCH THIS!!!");
			});

			connection.write(
			{
				"target": "Protolobe",
				"command": "EMPTY_COMMAND"
			});

			setTimeout(function()
			{
				expect(stub_handle_mission_control.called).to.be.false;
				expect(stub_handle_incoming_data.called).to.be.true;
				done();
			}, 200);
		});
		afterEach(function()
		{
			stub_handle_mission_control.restore();
			stub_handle_incoming_data.restore();
		});
	});
});
