'use strict';

class Cortex
{
	constructor(config)
	{
		console.log("STARTING Rover Core!");
		this.name = "Cortex";
		this.simulate = config.simulate;
		this.exec = require('child_process').exec;
		this.lobe_map = {};
		this.time_since_last_command = {};
		this.previous_lobe_status = {};
		// =====================================
		// Setting up Primus server
		// =====================================
		var Primus = require('primus');
		var http = require('http');
		console.log(`Setting up Primus (Websockets) Server`);
		var server = http.createServer();
		var primus = new Primus(server, { transformer: 'websockets' });

		server.listen(9000);

		console.log(`Setting up Primus (Websockets) Server COMPLETE`);
		primus.on('connection', (spark) =>
		{
			this.log.output('Connection was made from', spark.address);
			this.log.output('Connection id', spark.id);
			spark.on('data', (data) =>
			{
				if(data.hasOwnProperty('target') && data.hasOwnProperty('command'))
				{
					if(data["target"] === this.name)
					{
						this.handleMissionControl(data['command'], spark);
					}
					else
					{
						this.handleIncomingData(data, spark);
					}
				}
				else
				{
					this.log.output('INVALID Data: Incoming data did not contain target and command/connection properties.');
				}
			});
			spark.on('end', (/*data*/) =>
			{
				this.log.output('Disconnect from', spark.address);
				this.log.output('Disconnect id', spark.id);
				this.handleMissionControl("disconnect", spark);
			});
		});
		// =====================================
		// Standard feedback method back to Server
		// =====================================
		this.feedback = function(lobe_name)
		{
			var output = "";
			for (var i = 1; i < arguments.length; i++)
			{
				if(typeof arguments[i] === "object")
				{
					output += JSON.stringify(arguments[i])+"\n";
				}
				else
				{
					output += arguments[i]+"\n";
				}
			}
			primus.write({
				target: lobe_name,
				message: output
			});
		};
		// =====================================
		// Setting up Logs and Model
		// =====================================
		this.LOG = require('../utilities/Log');
		this.MODEL = require('../utilities/Model');

		this.log = new this.LOG(this.name, "white");
		this.Model = new this.MODEL(this.feedback);

		this.extended_utilities = require("../utilities/Extended.js");
		// =====================================
		// Loading modules
		// =====================================
		this.loadLobes(config.isolation);
		// =====================================
		// Setup Cortex Timer
		// =====================================
		this.cortex_loop = setInterval(() =>
		{
			this.handleIdleStatus();
			this.sendLobeStatus();
		}, 100);
	}
	handleIncomingData(data, spark)
	{
		var parent = this;
		var target = data['target'];
		if(this.lobe_map.hasOwnProperty(target))
		{
			if(this.lobe_map[target]['controller'] === spark.id)
			{
				setImmediate(function()
				{
					parent.time_since_last_command[target] = Date.now();
					parent.lobe_map[target]._react(data['command']);
				});
			}
			else
			{
				this.log.output(`Connection ID is not associated with target lobe: ${target}.`);
			}
		}
		else
		{
			this.log.output(`Target ${target} does not exist in lobe_map.`);
		}
	}
	sendLobeStatus() {
		for (var lobe in this.lobe_map) {
			if(!this.previous_lobe_status.hasOwnProperty(lobe))
			{
				this.previous_lobe_status[lobe] = {};
			}
			else if(this.previous_lobe_status[lobe]['state'] !== this.lobe_map[lobe]['state'])
			{
				this.previous_lobe_status[lobe] = {
					lobe: lobe,
					"controller": this.lobe_map[lobe]['controller'],
					"state" : this.lobe_map[lobe]['state']
				};
				this.feedback(this.name, this.previous_lobe_status[lobe]);
			}
		}
	}
	handleMissionControl(data, spark)
	{
		var msg;
		//// NOTE: Lobe cannot have names 'disconnect', 'halt', or 'resume'
		var actions = {
			"disconnect": (lobe) =>
			{
				this.lobe_map[lobe]['controller'] = "";
			},
			"halt": (lobe) =>
			{
				this.lobe_map[lobe]._halt();
			},
			"resume": (lobe) =>
			{
				this.lobe_map[lobe]._resume();
			}
		};
		if(Object.keys(actions).indexOf(data) !== -1)
		{
			for (var lobe in this.lobe_map)
			{
				if(this.lobe_map[lobe]['controller'] === spark.id)
				{
					actions[data](lobe);
				}
			}
		}
		else if(Object.keys(this.lobe_map).indexOf(data) !== -1)
		{
			if(!this.lobe_map[data]['controller'])
			{
				msg = `${data} controller assigned to connection: ${spark.id}`;
			}
			else
			{
				msg = `Reassigning ${spark.id} to lobe ${data}.`;
			}
			this.lobe_map[data]['controller'] = spark.id;
			this.log.output(msg);
			this.feedback('Cortex', msg);
		}
		else
		{
			msg = `Cortex could not handle command: ${data}.`;
			this.log.output(msg);
			this.feedback('Cortex', msg);
		}
	}
	handleIdleStatus()
	{
		for(var lobe in this.time_since_last_command)
		{
			var delta = Date.now()-this.time_since_last_command[lobe];
			if(delta >= this.lobe_map[lobe]['idle_timeout'])
			{
				this.lobe_map[lobe]._idle();
			}
		}
	}
	upcall(command)
	{
		var haltAll = function()
		{
			for(var lobe in this.time_since_last_command)
			{
				this.lobe_map[lobe]._halt();
			}
		};
		var idleAll = function()
		{
			for(var lobe in this.time_since_last_command)
			{
				this.lobe_map[lobe]._idle();
			}
		};
		var resumeAll = function()
		{
			for(var lobe in this.time_since_last_command)
			{
				this.lobe_map[lobe]._resume();
			}
		};
		switch(command)
		{
			case "HALTALL":
				haltAll();
				break;
			case "RESUMEALL":
				resumeAll();
				break;
			case "IDLEALL":
				idleAll();
				break;
			case "SYSTEM-SHUTDOWN":
				this.exec("shutdown -h now");
				break;
			case "SYSTEM-RESTART":
				this.exec("reboot");
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
			var source_path = `./${directory}/${directory}`;
			//// Generate Logger
			var log = new this.LOG(directory);
			//// Require protolobe if simulate is TRUE, otherwise require lobe from path.
			var Lobe = (this.simulate) ? require("./Protolobe/Protolobe") : require(source_path);
			//// Generate lobe utilities object
			var parent = this;
			var lobe_utitilites = {
				"name": directory,
				"log": log,
				"model": this.Model,
				"upcall": this.upcall,
				"extended": this.extended_utilities,
				"feedback": function()
				{
					var args = Array.from(arguments);
					args.unshift(directory);
					parent.feedback.apply(null, args);
				}
			};
			//// Construct Lobe module
			var module = new Lobe(lobe_utitilites);
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
		var fs = require('fs');
		var path = require('path');
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
			isolation = isolation.replace(/ /g,'').split(',');
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
			this.lobe_map[lobe['name']] = lobe;
			// Set time since last command to zero to IDLE all lobes in the beginning
			this.time_since_last_command[lobe['name']] = 0;
		}
	}
}

module.exports = Cortex;