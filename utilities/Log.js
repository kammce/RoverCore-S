"use strict";

var Console = require('console').Console;
var colors = require('colors/safe');
var fs = require('fs');

class Log
{
	constructor(module_name, output_color)
	{
		this.module = module_name;
		this.color = (input_str) => { return input_str; };
		this.setColor(output_color);
		// create new property with the name of this.module
		// set mute status for current module to false.
		this.constructor._mutes[this.module] = false;
	}
	// Output to stdout as well as the static log file
	output()
	{ // takes infinite arguments
		var console_args = Array.prototype.slice.call(arguments);
		var journal_args = Array.prototype.slice.call(arguments);
		// Add date, module and color into the console's arguments
		console_args.unshift(
			this.color(
				`[${Date().slice(0,-15)}][${this.module}] ::`
			)
		);
		// If 'color_in_file' is true, then add the color commands into the write stream
		if(this.constructor.color_in_file)
		{
			journal_args.unshift(
				this.color(
					`[${Date().slice(0,-15)}][${this.module}] ::`
				)
			);
		}
		else
		{
			journal_args.unshift(`[${Date().slice(0,-15)}][${this.module}] ::`);
		}
		// Output message to journal.
		this.constructor.journal.log.apply(this, journal_args);
		// If this modules is not muted then output to console.
		if(!this.constructor._mutes[this.module])
		{
			console.log.apply(this, console_args);
		}
	}
	setColor(output_color)
	{
		// check to see if the color exists and it is a function
		// use that function to color the output
		if(typeof colors[output_color] === "function")
		{
			this.color = colors[output_color];
		}
	}
	// Mute this module
	mute()
	{
		this.constructor._mutes[this.module] = true;
	}
	// Unmute this module
	unmute()
	{
		this.constructor._mutes[this.module] = false;
	}
}

/**** Static Field ****/
Log.color_in_file = false;

Log.initialize = function()
{
	var dir = './logs';
	if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
	// Name of stdout file
	Log.output_file = `./logs/stdout-${Date().slice(0,-15)}.log`.replace(/[ :]/g, '-');
	// Name of stderr file
	Log.error_file = `./logs/stdout-${Date().slice(0,-15)}.log`.replace(/[ :]/g, '-');
	// Generate the output file along with a write stream to it
	Log.writeOutput = fs.createWriteStream(Log.output_file);
	// Generate the error file along with a write stream to it
	Log.writeError = fs.createWriteStream(Log.error_file);
	// Create a custom console with file write streams as destinations for information
	Log.journal = new Console(Log.writeOutput, Log.writeError);
};

Log.deleteLogs = function()
{
	if(fs.existsSync(Log.output_file))
	{
		fs.unlinkSync(Log.output_file);
	}
	if(fs.existsSync(Log.error_file))
	{
		fs.unlinkSync(Log.error_file);
	}
};

// Initialize Log write streams and console outputs
Log.initialize();
// Map of modules that can be muted
Log._mutes = {};
// Static method to mute a log
Log.mute = function(module_name)
{
	// Check if log module name exists in _mutes structure
	if(Log._mutes.hasOwnProperty(module_name))
	{
		Log._mutes[module_name] = true;
		return true;
	}
	else
	{
		return false;
	}
};
// Static method to unmute an log
Log.unmute = function(module_name)
{
	// Check if log module name exists in _mutes structure
	if(Log._mutes.hasOwnProperty(module_name))
	{
		Log._mutes[module_name] = false;
		return true;
	}
	return false;
};

module.exports = Log;