"use strict";
/* Code is based off of http://seanmonstar.com/post/56448644049/consolelog-all-the-things. Retreived October 11th, 2015 */

// var log = function hijacked_log(level) {
//   if (arguments.length > 1 && level in this) {
//     console.log.apply(this, arguments);
//   } else {
//     var args = Array.prototype.slice.call(arguments);
//     args.unshift(`[${Date().slice(0,-15)}][LOBE-NAME] :: `);
//     console.log.apply(this, args);
//   }
// }

var Console = require('console').Console;
var colors = require('colors/safe');
var fs = require('fs');

class Log {
	constructor(module_name, output_color) {
		this.output_file = `./logs/stdout-${Date().slice(0,-15)}.log`;
		this.error_file = `./logs/stderr-${Date().slice(0,-15)}.log`;
		this.output = fs.createWriteStream(this.output_file);
		this.errorOutput = fs.createWriteStream(this.error_file);

		this.module = module_name;
		if(typeof colors[output_color] === "function") {
			this.color = colors[output_color];
		} else {
			this.color = function (input_str) {
				return input_str;
			}
		}
		
		this.logger = new Console(this.output, this.errorOutput);
		// set mute status for current module to false.
		this.constructor._mutes[this.module] = false;
	}
	log(level) {
		if (arguments.length > 1 && level in this) {
			this.logger.log.apply(this, arguments);
			if(!this.constructor._mutes[this.module]) {
				console.log.apply(this, arguments);
			}
		} else {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(
				this.color(
					`[${Date().slice(0,-15)}][${this.module}] ::`
				)
			);
			this.logger.log.apply(this, args);
			if(!this.constructor._mutes[this.module]) {
				console.log.apply(this, args);
			}
		}
	}
	mute() {
		this.constructor._mutes[this.module] = true;
	}
	unmute() {
		this.constructor._mutes[this.module] = false;
	}
}

Log._mutes = {};
Log.mute = function(module_name) {
	if(Log._mutes.hasOwnProperty(module_name)) {
		Log._mutes[module_name] = true;
		return true;
	} else {
		return false;
	}
}
Log.unmute = function(module_name) {
	if(Log._mutes.hasOwnProperty(module_name)) {
		Log._mutes[module_name] = false;
		return true;
	} else {
		return false;
	}
}

module.exports = Log;