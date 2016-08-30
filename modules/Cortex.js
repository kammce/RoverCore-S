'use strict';

class Cortex
{
	constructor(config)
	{
		console.log("STARTING Rover Core!");
		var parent = this;
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
				this.handleIncomingData(data);
			});
			spark.on('end', (/*data*/) =>
			{
				this.log.output('Disconnect from', spark.address);
				this.log.output('Disconnect id', spark.id);
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
		this.log = new this.LOG("Cortex", "white");

		this.MODEL = require('./Model');
		this.Model = new this.MODEL(this.feedback);

		this.SERIALPORT = require('serialport');

		var Spine = new require('./Spine');
		this.SPINE = undefined;
		// =====================================
		// Running Systems Check
		// =====================================
		console.log("Running Systems Check...");
		var os = require('os');

		if(os.hostname() === 'odroid' ||
			os.hostname() === 'beaglebone')
		{
			console.log(`System Hostname is on ${os.hostname()}`);
			this.SPINE = new Spine();
			this.SPINE.expose(13, "OUTPUT");
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
			console.log("Running on none Embedded platform. GPIO ports will not be used!");
		}
		// =====================================
		// Loading modules
		// =====================================
		this.loadLobes(config.isolation);

		// =====================================
		// Setup Idling Timer
		// =====================================
		this.idling_loop = setInterval(() =>
		{
			this.handleIdleStatus();
		}, 100);
	}
	handleIncomingData(data)
	{
		var parent = this;
		this.log.output(`INCOMING: `, data);
		try
		{
			if(data.hasOwnProperty('target') && data.hasOwnProperty('command'))
			{
				if(this.lobe_map.hasOwnProperty(data['target']))
				{
					setImmediate(function()
					{
						parent.time_since_last_command[data['target']] = Date.now();
						parent.lobe_map[data['target']]._react(data['command']);
					});
					return;
				}
				throw new Error(`Target ${data['target']} does not exist in lobe_map.`);
			}
			else if(data.hasOwnProperty('target') && data.hasOwnProperty('connection'))
			{
				switch(data['connection'])
				{
					case "disconnected":
						for(let lobe in this.lobe_map)
						{
							if(this.lobe_map[lobe]['mission_controller'] === data['target'])
							{
								this.lobe_map[lobe]._halt();
								return;
							}
						}
						break;
					case "connected":
						for(let lobe in this.lobe_map)
						{
							if(typeof this.lobe_map[lobe]['mission_controller'] === "string")
							{
								if(this.lobe_map[lobe]['mission_controller'] === data['target'])
								{
									this.lobe_map[lobe]._resume();
									return;
								}
							}
						}
						break;
					default:
						throw new Error(`Connection message must be 'connected' or 'disconnected', given ${data['connection']}.`);
				}
				throw new Error(`Target ${data['target']} is not associated with any lobes.`);
			}
			else
			{
				throw new Error(`Incoming data did not contain target and command/connection properties.`);
			}
		}
		catch(e)
		{
			this.log.output('INVALID Data: ', e);
		}
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
				// Simply end the process and allow "forever" to restart RoverCore
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
			// Read config.json file, parse it, and return config object
			config = JSON.parse(fs.readFileSync(`./modules/${directory}/config.json`));
			// check if config object has the right properties
			if(typeof config['lobe_name'] === "string" &&
				typeof config['log_color'] === "string" &&
				typeof config['idle_time'] === "number")
			{
				// Adding source code path to config object
				config['source_path'] = `./${directory}/${config['lobe_name']}`;
				// Generate Logger
				var log = new this.LOG(
					config['lobe_name'],
					config['log_color']
				);
				// Require protolobe if simulate is TRUE, otherwise require lobe from path.
				Lobe = (this.simulate) ? require("./Protolobe/Protolobe.js") : require(config['source_path']);
				// Generate lobe utilities object
				var lobe_utitilites = {
					"name": config['lobe_name'],
					"feedback": this.feedback,
					"log": log,
					"idle_timeout": config['idle_time'],
					"model": this.Model,
					"serial": this.SERIALPORT,
					"spine": this.SPINE,
					"upcall": this.upcall,
					"target": this.target
				};
				// Construct Lobe module
				var module = new Lobe(lobe_utitilites);
				// Attach config property to module
				module.config = config;
				// Attach mission controller to module
				module.mission_controller = config['mission_controller'];
				// Log that a Lobe was loaded correctly
				this.log.output(`Lobe ${config['lobe_name']} loaded SUCCESSFULLY`);
				// Return constructed lobe object
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
