'use strict';

class Cortex {
	constructor(connection, simulate, isolation) {
		console.log("STARTING Rover Core!");
		var parent = this;
		this.simulate = simulate;
		/** Standard feedback method back to Server **/
		this.feedback = function(lobe_name) {
			var output = "";
			if(lobe_name === "up-call") {
				parent.handleUpCall(arguments);
				return;
			}
			for (var i = 1; i < arguments.length; i++) {
				if(typeof arguments[i] === "object") {
					output += JSON.stringify(arguments[i])+"\n";
				} else {
					output += arguments[i]+"\n";
				}
			}
			connection.write({
				target: lobe_name,
				message: output
			});
		};

		// Loading Cortex Modules
		this.exec = require('child_process').exec;
		this.LOG = require('./Log');
		this.MODEL = require('./Model');
		this.SPINE = require('./Spine');
		this.SERIALPORT = require('serialport');
		// this.I2C = function () {};
		// if(!this.simulate) {
		// 	var I2C_BUS = require('i2c-bus');
		// 	this.I2C = I2C_BUS.openSync(1);
		// }

		// Store Singleton version of Classes
		this.log = new this.LOG("Cortex", "white");
		this.Model = new this.MODEL(this.feedback);
		if(!this.simulate) {
			this.Spine = new this.SPINE();
		}
		/** Load All Modules in Module Folder **/
		this.lobe_map = {};
		this.time_since_last_command = {};
		// Load all modules from module folder into module’s map.
		this.loadLobes(isolation);
		/** Deliver data from server to Modules **/
		// Send Model to Signal Relay on update

		/** Connect to Signal Relay **/
		// Cortex should act as a client and connect to Signal
		// Relayusing primus.js and websockets as the transport.
		connection.on('open', function open() {
			connection.write({
				intent: 'REGISTER',
				info: {
					entity: 'cortex',
					password: 'destroyeveryone'
				}
			});
			parent.log.output("CONNECTED! I AM HERE!");
		});
		connection.on('data', function(data) {
			parent.handleIncomingData(data);
		});
		connection.on('error', function error(err) {
			parent.log.output('CONNECTION error!', err.stack);
		});
		connection.on('reconnect', function (/* opts */) {
			parent.log.output('RECONNECTION attempt started!');
		});
		connection.on('reconnect scheduled', function (opts) {
			parent.log.output(`Reconnecting in ${opts.scheduled} ms`);
			parent.log.output(`This is attempt ${opts.attempt} out of ${opts.retries}`);
		});
		connection.on('reconnected', function (opts) {
			parent.log.output(`It took ${opts.duration} ms to reconnect`);
		});
		connection.on('reconnect timeout', function (err/*, opts*/) {
			parent.log.output(`Timeout expired: ${err.message}`);
		});
		connection.on('reconnect failed', function (err/*, opts*/) {
			parent.log.output(`The reconnection failed: ${err.message}`);
		});
		connection.on('end', function () {
			parent.log.output('Connection closed');
		});
		// Handle Idling Lobes that have not gotten a command
		this.idling_loop = setInterval(function() {
			parent.handleIdleStatus();
		}, 100);
	}
	handleIncomingData(data) {
		var parent = this;
		// Log any data coming in
		this.log.output(`INCOMING: `, data);
		try {
			if(data.hasOwnProperty('target') &&
				data.hasOwnProperty('command')) {
				if(this.lobe_map.hasOwnProperty(data['target'])) {
					setImmediate(function() {
						parent.time_since_last_command[data['target']] = Date.now();
						parent.lobe_map[data['target']]._react(data['command']);
					});
					return;
				}
				throw new Error(`Target ${data['target']} does not exist in lobe_map.`);
			} else if(data.hasOwnProperty('target') &&
				data.hasOwnProperty('connection')) {
				switch(data['connection']) {
					case "disconnected":
						for(let lobe in this.lobe_map) {
							if(this.lobe_map[lobe]['mission_controller'] === data['target']) {
								this.lobe_map[lobe]._halt();
								return;
							}
						}
						break;
					case "connected":
						for(let lobe in this.lobe_map) {
							if(typeof this.lobe_map[lobe]['mission_controller'] === "string") {
								if(this.lobe_map[lobe]['mission_controller'] === data['target']) {
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
			} else {
				throw new Error(`Incoming data did not contain target and command/connection properties.`);
			}
		} catch(e) {
			this.log.output('INVALID Data: ', e);
		}
	}
	handleIdleStatus() {
		for(var lobe in this.time_since_last_command) {
			var delta = Date.now()-this.time_since_last_command[lobe];
			if(delta >= this.lobe_map[lobe]['idle_time']) {
				this.lobe_map[lobe]._idle();
			}
		}
	}
	upcall(command) {
		var haltAll = function() {
			for(var lobe in this.time_since_last_command) {
				this.lobe_map[lobe]._halt();
			}
		};
		var idleAll = function() {
			for(var lobe in this.time_since_last_command) {
				this.lobe_map[lobe]._idle();
			}
		};
		switch(command) {
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
	loadLobe(directory) {
		var fs = require('fs');
	    var config, Lobe;
		try {
			// Read config.json file, parse it, and return config object
			config = JSON.parse(fs.readFileSync(`./modules/${directory}/config.json`));
			// check if config object has the right properties
			if(typeof config['lobe_name'] === "string" && 
				typeof config['log_color'] === "string" && 
				typeof config['idle_time'] === "number") {
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
					"i2c": this.I2C,
					"model": this.Model,
					"serial": this.SERIALPORT,
					"upcall": this.upcall,
				};
				// Construct Lobe module
				var module = new Lobe(lobe_utitilites);
				/*
				config['lobe_name'], 
				this.feedback,
				log,
				config['idle_time'],
				this.I2C,
				this.Model,
				this.SERIALPORT,
				this.upcall
				*/
				// Attach config property to module
				module.config = config;
				// Attach mission controller to module
				module.mission_controller = config['mission_controller'];
				// Log that a Lobe was loaded correctly
				this.log.output(`Lobe ${config['lobe_name']} loaded SUCCESSFULLY`);
				// Return constructed lobe object
				return module;
			} else {
				throw new Error(`Failed to load configuration file for ${ directory }`);
			}
		} catch(e) {
			// Log that a Lobe did not load properly
			this.log.output(`Lobe ${config['lobe_name']} FAILED to load`, e);
		}
	}
	loadLobes(isolation) {
		var fs = require('fs');
	    var path = require('path');

	    /********************************
	     *		Utility functions		*
	     ********************************/

		function getDirectories(srcpath) {
			return fs.readdirSync(srcpath).filter(function(file) {
				return fs.statSync(path.join(srcpath, file)).isDirectory();
			});
		}
		var modules = getDirectories("./modules");
		
		// Take the intersection of the modules in the modules folder and the isolation arguments
		if(typeof isolation === "string") {
			isolation = isolation.replace(/ /g,'').split(',');
			// Using filter and indexOf to create a 
			// set intersection between isolation and modules
			modules = isolation.filter(function(n) {
				return modules.indexOf(n) != -1;
			});
		}
		if(modules.length === 0) { 
			this.log.output("No modules found, exiting RoverCore");
			process.exit(); 
		}
		for (var i = 0; i < modules.length; i++) {
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
