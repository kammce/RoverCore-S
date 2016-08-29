'use strict';

class Cortex
{
	constructor(controls)
	{
		console.log("STARTING Rover Core!");
		var parent = this;

		this.simulate = controls.simulate;
		this.connection = controls.connection;
		/** Standard feedback method back to Server **/
		this.feedback = function(lobe_name)
		{
			var output = "";
			for (var i = 1; i < arguments.length; i++)
			{
				//console.log(arguments[i]);
				if(typeof arguments[i] === "object")
				{
					output += JSON.stringify(arguments[i])+"\n";
				}
				else
				{
					output += arguments[i]+"\n";
				}
			}
			parent.connection.write({
				target: lobe_name,
				message: output
			});
		};

		// Loading Cortex Modules
		this.exec = require('child_process').exec;
		this.LOG = require('./Log');
		this.MODEL = require('./Model');
		var Spine = new require('./Spine');
		this.SPINE = undefined;
		this.SERIALPORT = require('serialport');

		console.log("Running Systems Check...");
		var os = require('os');

		if(os.hostname() === 'odroid' || os.hostname() === 'beaglebone')
		{
			console.log(`System Hostname is on ${os.hostname()}`);
			this.SPINE = new Spine();
			// Setup SPINE
			this.SPINE.expose(13, "OUTPUT");
			setInterval(() =>
			{
				this.led_state = 0;
				var switcher = (led_state === 5 || led_state === 7) ? 0 : 1;
				++this.led_state;
				this.led_state = (this.led_state > 7) ? 0 : this.led_state;
				this.SPINE.digitalWrite(13, switcher);
			}, 50);
		}
		else
		{
			console.log("Running on none Embedded platform. GPIO ports will not be used!");
		}

		// Store Singleton version of Classes
		this.log = new this.LOG("Cortex", "white");
		this.Model = new this.MODEL(this.feedback);
		/** Load All Modules in Module Folder **/
		this.lobe_map = {};
		this.time_since_last_command = {};
		// Load all modules from module folder into module’s map.
		this.loadLobes(controls.isolation);
		/** Deliver data from server to Modules **/
		// Send Model to Signal Relay on update

		/** Connect to Signal Relay **/
		// Cortex should act as a client and connect to Signal
		// Relayusing primus.js and websockets as the transport.
		this.connection.on('open', () =>
		{
			this.connection.write(
			{
				intent: 'REGISTER',
				info:
				{
					entity: 'cortex',
					password: 'destroyeveryone'
				}
			});
			parent.log.output("CONNECTED! I AM HERE!");
		});
		this.connection.on('data', (data) =>
		{
			this.handleIncomingData(data);
		});
		this.connection.on('error',  (err) =>
		{
			this.log.output('CONNECTION error!', err.stack);
		});
		this.connection.on('reconnect', () =>
		{
			this.log.output('RECONNECTION attempt started!');
		});
		this.connection.on('reconnect scheduled', (opts) =>
		{
			this.log.output(`Reconnecting in ${opts.scheduled} ms`);
			this.log.output(`This is attempt ${opts.attempt} out of ${opts.retries}`);
		});
		this.connection.on('reconnected', (opts) =>
		{
			this.log.output(`It took ${opts.duration} ms to reconnect`);
		});
		this.connection.on('reconnect timeout', (err) =>
		{
			this.log.output(`Timeout expired: ${err.message}`);
		});
		this.connection.on('reconnect failed', (err) =>
		{
			this.log.output(`The rethis.connection failed: ${err.message}`);
		});
		this.connection.on('end', () =>
		{
			this.log.output('Connection closed');
		});
		// Handle Idling Lobes that have not gotten a command
		this.idling_loop = setInterval(() =>
		{
			parent.handleIdleStatus();
		}, 100);
	}
	handleIncomingData(data)
	{
		var parent = this;
		// Log any data coming in
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
					"url": this.connection.url
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
		/********************************
		 *		Utility functions		*
		 ********************************/
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
