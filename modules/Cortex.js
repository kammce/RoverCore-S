'use strict';

class Cortex
{
	constructor(config)
	{
		console.log("STARTING Rover Core!");
		var parent = this;
		this.name = "Cortex";
		this.simulate = config.simulate;
		this.exec = require('child_process').exec;
		this.lobe_map = {};
		this.time_since_last_command = {};
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
		this.LOG = require('./Log');
		this.log = new this.LOG(this.name, "white");

		this.MODEL = require('./Model');
		this.Model = new this.MODEL(this.feedback);

		this.SERIALPORT = require('serialport');

		var SPINE = new require('./Spine');
		this.spine = undefined;
		// =====================================
		// Running Systems Check
		// =====================================
		console.log("Running Systems Check...");
		var os = require('os');
		// =====================================
		// RoverCore Blink Led Indicator
		// =====================================
		if(os.hostname() === 'odroid')
		{
			console.log(`System Hostname is on ${os.hostname()}`);
			this.spine = new SPINE();
			this.spine.expose(13, "OUTPUT");
			setInterval(function()
			{
				this.led_state = 0;
				var switcher = (this.led_state === 5 || this.led_state === 7) ? 0 : 1;
				++this.led_state;
				this.led_state = (this.led_state > 7) ? 0 : this.led_state;
				parent.SPINE.digitalWrite(13, switcher);
			}, 50);
		}
		else
		{
			console.log("Not Running on Odroid XU4. GPIO ports will not be used!");
		}
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
		var status = {};
		for (var lobe in this.lobe_map) {
			status[lobe] = {
				controller: this.lobe_map[lobe]['controller'],
				state: this.lobe_map[lobe]['state']
			};
		}
		this.feedback(this.name, status);
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
				this.lobe_map[data]['controller'] = spark.id;
			}
			else
			{
				msg = `Cortex could not assign ${spark.id} to lobe ${data}, lobe does not exist.`;
				this.log.output(msg);
				this.feedback('Cortex', msg);
			}
		}
		else
		{
			msg = `Cortex could not handle command: ${data}.`;
			this.log.output(msg);
			this.feedback('Cortex', msg);
		}
		//// Find lobe associated with
	}
	handleIdleStatus()
	{
		for(var lobe in this.time_since_last_command)
		{
			var delta = Date.now()-this.time_since_last_command[lobe];
			if(delta >= this.lobe_map[lobe]['idle_time'])
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
		switch(command)
		{
			case "HALTALL":
				haltAll();
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
		var fs = require('fs');
		var config, Lobe;
		try
		{
			//// Read config.json file, parse it, and return config object
			config = JSON.parse(fs.readFileSync(`./modules/${directory}/config.json`));
			//// check if config object has the right properties
			if(typeof config['lobe_name'] === "string" &&
				typeof config['log_color'] === "string" &&
				typeof config['idle_time'] === "number")
			{
				//// Adding source code path to config object
				config['source_path'] = `./${directory}/${config['lobe_name']}`;
				//// Generate Logger
				var log = new this.LOG(
					config['lobe_name'],
					config['log_color']
				);
				//// Require protolobe if simulate is TRUE, otherwise require lobe from path.
				Lobe = (this.simulate) ? require("./Protolobe/Protolobe.js") : require(config['source_path']);
				//// Generate lobe utilities object
				var lobe_utitilites = {
					"name": config['lobe_name'],
					"feedback": this.feedback,
					"log": log,
					"idle_timeout": config['idle_time'],
					"model": this.Model,
					"serial": this.SERIALPORT,
					"spine": this.spine,
					"upcall": this.upcall,
					"target": this.target
				};
				//// Construct Lobe module
				var module = new Lobe(lobe_utitilites);
				//// Attach config property to module
				module.config = config;
				//// Attach mission controller to module
				module.mission_controller = config['mission_controller'];
				//// Log that a Lobe was loaded correctly
				this.log.output(`Lobe ${config['lobe_name']} loaded SUCCESSFULLY`);
				//// Return constructed lobe object
				return module;
			}
			else
			{
				throw new Error(`Failed to load configuration file for ${ directory }`);
			}
		}
		catch(e)
		{
			// Log that a Lobe did not load properly
			this.log.output(`Lobe ${config['lobe_name']} FAILED to load`, e);
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
			this.lobe_map[lobe.config['lobe_name']] = lobe;
			// Set time since last command to zero to IDLE all lobes in the beginning
			this.time_since_last_command[lobe.config['lobe_name']] = 0;
		}
	}
}

module.exports = Cortex;
