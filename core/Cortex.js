"use strict";

/**
    @class
    @classdesc Cortex is the brain of RoverCore and handles the following:
    * Creates a bidirectional websockets server for mission control to connect to the Rover with.
	* Can also act as a proxy server for which another instance of RoverCore-S and Mission control can communicate through. Mission control and the rover will connect to the IP address of the known proxy. Useful when the IP address of the rover is not known or directly accessible by mission control.
	* Dynamically loads the modules (Called Lobes).
	* Handles activating Lobe HALT, RESUME or IDLE states. (see Lobes States)
	* Handles incoming messages from Mission Control and either acts upon them (if directed at Cortex) or sends commands to the appropriate Lobes through their REACT function.
	* Creates a utility structure which is given to each Lobe in their constructor to allow lobes to:
	* Store and Retrieve information from other lobes (see Model.js)
	* Communicate with mission control (see feedback function in Cortex.js)
	* Log information to STDOUT and to a log file (see Log.js)
	* Make UPCALLS to cortex to do global actions that effect the whole system or other lobes. (see upcall function in Cortex.js)

    @param {string} name - Tutorial name.
    @param {string} content - Text content.
    @param {number} type - Source formating.
 */
class Cortex
{
	constructor(config)
	{
		console.log("STARTING Rover Core!");
		this.name = "Cortex";
		this.cortex = this;
		this.simulate = config.simulate;
		this.exec = require("child_process").exec;
		this.lobe_map = {  };
		this.time_since_last_command = {  };
		this.status = {  };
		this.mission_controllers = {  };
		this.debug_level = config.debug_level || 0;
		// =====================================
		// Setting up Primus server
		// =====================================
		var Primus = require("primus");
		var http = require("http");
		console.log(`Setting up Primus (Websockets) Server`);
		var server = http.createServer();
		var primus = new Primus(server, { transformer: "websockets" });

		server.listen(9000);

		console.log(`Setting up Primus (Websockets) Server COMPLETE`);
		primus.on("connection", (spark) =>
		{
			this.log.output("Connection was made from", spark.address);
			this.log.output("Connection id", spark.id);
			spark.on("data", (data) =>
			{
				try
				{
					if("target" in data && "command" in data)
					{
						if(data["target"] === this.name)
						{
							this.handleMissionControl(data["command"], spark);
						}
						else
						{
							this.handleIncomingData(data, spark);
						}
					}
					else
					{
						this.log.output("INVALID Data: Incoming data did not contain target and command properties.");
					}
				}
				catch(e)
				{
					this.log.output("INVALID: Failed to evaluate incoming data.");
				}
			});
			spark.on("end", (/*data*/) =>
			{
				this.log.output("Disconnect from", spark.address);
				this.log.output("Disconnect id", spark.id);
				this.handleMissionControl("disconnect", spark);
			});
		});
		// =====================================
		// Standard feedback method back to Server
		// =====================================
		this.feedback_generator = function(lobe_name)
		{
			var f = function()
			{
				var output = "";

				for (var argument of arguments)
				{
					// console.log(argument, JSON.stringify(argument));
					if(typeof argument === "object")
					{
						output += JSON.stringify(argument)+"\n";
					}
					else
					{
						output += argument+"\n";
					}
				}
				primus.write(
				{
					target: lobe_name,
					message: output
				});
			};

			return f;
		};

		this.feedback = this.feedback_generator(this.name);
		// =====================================
		// Setting up Logs and Model
		// =====================================
		this.LOG = require("Log");
		this.LOG.disable_colors = config.no_color;
		this.MODEL = require("Model");
		//// Initialize Log write streams and console outputs
		this.LOG.initialize();
		//// Creating Cortex's log instance.
		this.log = new this.LOG(this.name, "white", this.debug_level);
		//// Creating global Model object
		this.Model = new this.MODEL(this.feedback_generator("model"));

		// =====================================
		// Loading modules
		// =====================================
		this.loadLobes(config.isolation);
		// =====================================
		// Setup Cortex Timer
		// =====================================
		this.cortex_loop_timeout = null;
		this.cortex_loop = () =>
		{
			this.handleIdleStatus();
			this.sendLobeStatus();
			//// Add next cortex loop into event loop
			this.cortex_loop_timeout = setTimeout(() =>
			{
				this.cortex_loop();
			}, 100);
		};

		this.cortex_loop();
	}
	handleIncomingData(data)
	{
		this.log.debug2(data);
		var target = data["target"];
		var status = true;
		if(this.lobe_map.hasOwnProperty(target))
		{
			setImmediate(() =>
			{
				try
				{
					this.time_since_last_command[target] = Date.now();
					this.lobe_map[target]._react(data["command"]);
				}
				catch(e)
				{
					var msg = `_react failure: ${e}`;
					this.log.debug1(msg);
					this.feedback(msg);
				}
			});
		}
		else
		{
			this.log.output(`Target ${target} does not exist in lobe_map.`);
			status = false;
		}
		return status;
	}
	sendLobeStatus()
	{
		var change_flag = false;
		for (var lobe in this.lobe_map)
		{
			if(!this.status.hasOwnProperty(lobe))
			{
				this.status[lobe] = {
					state: this.lobe_map[lobe]["state"]
				};
				change_flag = true;
			}
			else if(this.status[lobe]["state"] !== this.lobe_map[lobe]["state"])
			{
				this.status[lobe] = {
					state: this.lobe_map[lobe]["state"]
				};
				change_flag = true;
			}
		}
		if(change_flag)
		{
			this.feedback({
				type: "status",
				data: this.status
			});
		}
	}
	sendInterfaceStatus()
	{
		this.feedback({
			type: "mission_controllers",
			data: this.mission_controllers
		});
	}
	//// TODO: Create a unit test for this method
	addInterface(controller, spark)
	{
		this.feedback(`${controller}: Interface Connected!`);
		this.mission_controllers[controller] = spark.id;
	}
	//// TODO: Create a unit test for this method
	removeInterface(spark)
	{
		for(var controller in this.mission_controllers)
		{
			if(this.mission_controllers[controller] === spark.id)
			{
				this.feedback(`${controller}: Interface Disconnected!`);
				this.mission_controllers[controller] = "";
				break;
			}
		}
	}
	//// TODO: Create a unit test for this method
	//// ADD: The ability to invoke lobe state changes through this method
	handleMissionControl(data, spark)
	{
		if(data === "disconnect")
		{
			this.removeInterface(spark);
		}
		else if(typeof data["controller"] === "string")
		{
			this.addInterface(data["controller"], spark);
		}
		this.sendInterfaceStatus();
		// var msg;
		// //// NOTE: Lobe cannot have names "disconnect", "halt", "resume", or "idle"
		// var actions = {
		// 	"halt": (lobe) =>
		// 	{
		// 		this.lobe_map[lobe]._halt();
		// 	},
		// 	"resume": (lobe) =>
		// 	{
		// 		this.lobe_map[lobe]._resume();
		// 	},
		// 	"idle": (lobe) =>
		// 	{
		// 		this.lobe_map[lobe]._idle();
		// 	}
		// };

		// // if("lobe" in data && "action" in data)
		// // {
		// // 	actions[data["action"]](data["lobe"]);
		// // 	msg = `Cortex DOES NOT DO ANYTHING WITH THIS ANYMORE.`;
		// // }
		// // else
		// // {
		// 	msg = `Cortex DOES NOT DO ANYTHING WITH THIS ANYMORE.`;
		// // }

		// this.log.output(msg);
		// this.feedback(msg);
	}
	handleIdleStatus()
	{
		for(var lobe in this.time_since_last_command)
		{
			var delta = Date.now()-this.time_since_last_command[lobe];
			if(delta >= this.lobe_map[lobe]["idle_timeout"] && this.lobe_map[lobe]["state"] !== "HALTED")
			{
				this.lobe_map[lobe]._idle();
			}
		}
	}
	LobeControlAll(ctrl)
	{
		for(var lobe in this.time_since_last_command)
		{
			switch(ctrl)
			{
				case "HALTALL":
					this.lobe_map[lobe]._halt();
					break;
				case "IDLEALL":
					this.lobe_map[lobe]._idle();
					break;
				case "RESUMEALL":
					this.lobe_map[lobe]._resume();
					break;
			}
		}
	}
	//// TODO: Create a unit test for this method
	upcall(command, ...params)
	{
		switch(command)
		{
			case "CALL":
				var [upcall_target, upcall_command] = params;
				this.cortex.handleIncomingData({
					target: upcall_target,
					command: upcall_command
				}, -1);
				break;
			case "HALTALL":
			case "RESUMEALL":
			case "IDLEALL":
				this.cortex.LobeControlAll(command);
				break;
			case "SYSTEM-SHUTDOWN":
				this.cortex.exec("shutdown -h now");
				break;
			case "SYSTEM-RESTART":
				this.cortex.exec("reboot");
				break;
			case "RESTART-CORTEX":
				//// Simply end the process and allow "forever" to restart RoverCore
				process.exit(0);
				break;
		}
	}
	loadLobe(directory)
	{
		try
		{
			//// Adding source code path to config object
			var source_path = `${directory}/${directory}`;
			//// Generate Logger
			var log = new this.LOG(directory, "white", this.debug_level);
			//// Require protolobe if simulate is TRUE, otherwise require lobe from path.
			var Lobe = (this.simulate) ? require("./Protolobe/Protolobe") : require(source_path);
			//// Generate lobe utilities object
			var upcall = this.upcall;
			var lobe_utitilites = {
				"name": directory,
				"model": this.Model,
				"feedback": this.feedback_generator(directory),
				upcall,
				log
			};
			//// Construct Lobe module
			var module = new Lobe(lobe_utitilites);
			//// Store reference to Cortex instance in lobe object
			//// Each module contains a reference to Cortex
			module.cortex = this;
			//// Log that a Lobe was loaded correctly
			this.log.output(`Lobe ${directory} loaded SUCCESSFULLY`);
			//// Return constructed lobe object
			return module;
		}
		catch(e)
		{
			// Log that a Lobe did not load properly
			this.log.output(`Lobe ${directory} FAILED to load`, e);
		}
	}
	loadLobes(isolation)
	{
		var fs = require("fs");
		var path = require("path");
		//// Utility functions
		function getDirectories(srcpath)
		{
			return fs.readdirSync(srcpath).filter(function(file)
			{
				return fs.statSync(path.join(srcpath, file)).isDirectory();
			});
		}
		var modules = getDirectories("./modules");
		// Take the intersection of the modules in the modules folder and the isolation arguments
		if(typeof isolation === "string")
		{
			isolation = isolation.replace(/ /g,"").split(",");
			// Using filter and indexOf to create a
			// set intersection between isolation and modules
			modules = isolation.filter(function(n)
			{
				return modules.indexOf(n) !== -1;
			});
		}
		if(modules.length === 0)
		{
			this.log.output("No modules found, exiting RoverCore");
			process.exit();
		}
		for (var i = 0; i < modules.length; i++)
		{
			var lobe = this.loadLobe(modules[i]);
			// skip lobe if it returns undefined
			if(typeof lobe === "undefined") { continue; }
			this.lobe_map[lobe["name"]] = lobe;
			// Set time since last command to zero to IDLE all lobes in the beginning
			this.time_since_last_command[lobe["name"]] = 0;
		}
	}
}

module.exports = Cortex;
