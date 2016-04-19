'use strict';

class Cortex {
	constructor(connection, simulate) {
		console.log("STARTING Rover Core!");
		var parent = this;
		this.simulate = simulate;
		/** Standard feedback method back to Server **/
		this.feedback = function(lobe_name) {
			var output = "";
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
		this.LOG = require('./Log');
		this.MODEL = require('./Model');
		this.SPINE = require('./Spine');
		this.I2C = function () {};
		if(!this.simulate) {
			var I2C_BUS = require('i2c-bus');
			this.I2C = I2C_BUS.openSync(3);
		}

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
		this.loadLobes();
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
	loadLobes() {
		var fs = require('fs');
	    var path = require('path');

		function getDirectories(srcpath) {
			return fs.readdirSync(srcpath).filter(function(file) {
				return fs.statSync(path.join(srcpath, file)).isDirectory();
			});
		}
		// Get all lobe configuration files
		var lobes_directories = getDirectories("./modules");
		var lobe_config_files = [];
		var i = 0;
		for (i = 0; i < lobes_directories.length; i++) {
			try {
				// Read config.json file, parse it, and return config object
				var config = JSON.parse(fs.readFileSync(`./modules/${lobes_directories[i]}/config.json`));
				// check if config object has the right properties
				if(config.hasOwnProperty('lobe_name') && 
					config.hasOwnProperty('log_color') && 
					config.hasOwnProperty('idle_time')) {
					if(typeof config['lobe_name'] === "string" && 
						typeof config['log_color'] === "string" && 
						typeof config['idle_time'] === "number") {
						// typeof config['mission_controller'] === "string" :: Not required!!
						// adding source code path to config object
						config['source_path'] = `./${lobes_directories[i]}/${config['lobe_name']}`;
						// pushing config object to the end of list
						lobe_config_files.push(config);
						continue; // removes the need for multiple else statements
					}
				}
				throw new Error(`Failed to load configuration file for ${ lobes_directories[i] }`);
			} catch(e) {
				this.log.output(e);
			}
		}
		// Each module will have a unique logger based on their configuration file
		for (i = 0; i < lobe_config_files.length; i++) {
			// Generate Logger 
			var lobe_log = new this.LOG(
				lobe_config_files[i]['lobe_name'], 
				lobe_config_files[i]['log_color']
			);
			// Require the selected Lobe
			try {
				var Lobe;
				if(this.simulate) {
					Lobe = require("./Protolobe/Protolobe.js");
				} else {
					Lobe = require(lobe_config_files[i]['source_path']);
				}
				// Add Lobe to Lobe Map with key being the lobe_name
				this.lobe_map[lobe_config_files[i]['lobe_name']] = new Lobe(
					lobe_config_files[i]['lobe_name'], 
					this.feedback,
					lobe_log,
					lobe_config_files[i]['idle_time'],
					this.I2C,
					this.Model
				);
				// Give lobe property mission_controller. 
				// If mission_controller disconnects or reconnects, 
				// the lobe will halt or resume respectively.
				if(typeof lobe_config_files[i]['mission_controller'] === "string") {
					this.lobe_map[lobe_config_files[i]['lobe_name']].mission_controller = lobe_config_files[i]['mission_controller'];
				}
				// Set time since last command to zero to IDLE all lobes in the beginning
				this.time_since_last_command[lobe_config_files[i]['lobe_name']] = 0;
				// Log that a Lobe was loaded correctly
				this.log.output(`Lobe ${lobe_config_files[i]['lobe_name']} loaded SUCCESSFULLY`);
			} catch(e) {
				// Log that a Lobe did not load properly
				this.log.output(`Lobe ${lobe_config_files[i]['lobe_name']} FAILED to load`, e);
			}
		}
	}
}

module.exports = Cortex;