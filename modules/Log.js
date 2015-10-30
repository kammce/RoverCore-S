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

/**** Prototype Field ****/
class Log {
	constructor(module_name, output_color) {
		this.module = module_name;
		// check to see if the color exists and it is a function
		if(typeof colors[output_color] === "function") {
			// use that function to color the output
			this.color = colors[output_color];
		} else {
			// otherwise, no color, input === output
			this.color = function (input_str) {
				return input_str;
			};
		}
		// create new property with the name of this.module
		// set mute status for current module to false.
		this.constructor._mutes[this.module] = false;
	}
	// Output to stdout as well as the static log file
	output() { // takes infinite arguments
		var console_args = Array.prototype.slice.call(arguments);
		var journal_args = Array.prototype.slice.call(arguments);
		// Add date, module and color into the console's arguments
		console_args.unshift(
			this.color(
				`[${Date().slice(0,-15)}][${this.module}] ::`
			)
		);
		// If 'color_in_file' is true, then add the color commands into the write stream
		if(this.constructor.color_in_file) {
			journal_args.unshift(
				this.color(
					`[${Date().slice(0,-15)}][${this.module}] ::`
				)
			);
		} else {
			journal_args.unshift(`[${Date().slice(0,-15)}][${this.module}] ::`);
		}
		// Output message to journal.
		this.constructor.journal.log.apply(this, journal_args);
		// If this modules is not muted then output to console.
		if(!this.constructor._mutes[this.module]) {
			console.log.apply(this, console_args);
		}
		/*
		if(this.constructor.color_in_file) {
			this.constructor.journal.log(this.color(`[${Date().slice(0,-15)}][${this.module}] ::`));
		} else {
			this.constructor.journal.log(`[${Date().slice(0,-15)}][${this.module}] ::`);
		}
		console.log(this.color(`[${Date().slice(0,-15)}][${this.module}] ::`));
		for (var i = 0; i < arguments.length; i++) {
			this.constructor.journal.log(arguments[i]);
			if(!this.constructor._mutes[this.module]) {
				console.log(arguments[i]);
			}
		}
		*/


		/*if (arguments.length > 1 && level in this) {
			this.constructor.journal.log.apply(this, arguments);
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
			this.constructor.journal.log.apply(this, args);
			if(!this.constructor._mutes[this.module]) {
				console.log.apply(this, args);
			}
		}*/
	}
	// Mute this module
	mute() {
		this.constructor._mutes[this.module] = true;
	}
	// Unmute this module
	unmute() {
		this.constructor._mutes[this.module] = false;
	}
}
/**** Static Field ****/
Log.color_in_file = false;
// Name of stdout file
Log.output_file = `./logs/stdout-${Date().slice(0,-15)}.log`;
// Name of stderr file
Log.error_file = `./logs/stderr-${Date().slice(0,-15)}.log`;
// Generate the output file along with a write stream to it
Log.writeOutput = fs.createWriteStream(Log.output_file);
// Generate the error file along with a write stream to it
Log.writeError = fs.createWriteStream(Log.error_file);
// Create a custom console with file write streams as destinations for information
Log.journal = new Console(Log.writeOutput, Log.writeError);

// Map of modules that can be muted
Log._mutes = {};
// Static method to mute a log
Log.mute = function(module_name) {
	// Check if log module name exists in _mutes structure
	if(Log._mutes.hasOwnProperty(module_name)) {
		Log._mutes[module_name] = true;
		return true;
	} else {
		return false;
	}
};
// Static method to unmute an log
Log.unmute = function(module_name) {
	// Check if log module name exists in _mutes structure
	if(Log._mutes.hasOwnProperty(module_name)) {
		Log._mutes[module_name] = false;
		return true;
	} else {
		return false;
	}
};

module.exports = Log;