"use strict";

var Console = require("console").Console;
var colors = require("colors/safe");
var fs = require("fs");

class Log
{
	constructor(module_name, output_color, debug_level)
	{
		this.module = module_name;
		this.color = (input_str) => { return input_str; };
		this.setColor(output_color);
		this.debug_level = debug_level || 0;
		//// create new property with the name of this.module
		//// set mute status for current module to false.
		this.constructor._mutes[this.module] = false;
	}
	//// Output to stdout as well as the static log file
	output()
	{
		//// takes infinite arguments
		var console_args = Array.prototype.slice.call(arguments);
		var journal_args = Array.prototype.slice.call(arguments);
		var module_timestamp_msg = `[${Date().slice(0,-15)}][${this.module}] ::`;
		//// Add date, module and color into the console"s arguments
		console_args.unshift(this.color(module_timestamp_msg));
		journal_args.unshift(module_timestamp_msg);
		//// Output message to journal.
		this.constructor.journal.log.apply(this, journal_args);
		//// If this modules is not muted then output to console.
		if(!this.constructor._mutes[this.module])
		{
			console.log.apply(this, console_args);
		}
	}
	//// Output to stdout as well as the static log file
	debug1()
	{
		if(this.debug_level >= 1)
		{
			var debug_args = Array.prototype.slice.call(arguments);
			debug_args.unshift("{DEBUG-1} ::");
			this.output.apply(this, debug_args);
		}
	}
	debug2()
	{
		if(this.debug_level >= 2)
		{
			var debug_args = Array.prototype.slice.call(arguments);
			debug_args.unshift("{DEBUG-2} ::");
			this.output.apply(this, debug_args);
		}
	}
	debug3()
	{
		if(this.debug_level >= 3)
		{
			var debug_args = Array.prototype.slice.call(arguments);
			debug_args.unshift("{DEBUG-3} ::");
			this.output.apply(this, debug_args);
		}
	}
	setColor(output_color)
	{
		//// check to see if the color exists and it is a function
		//// use that function to color the output
		if(typeof colors[output_color] === "function" &&
			this.constructor.disable_colors !== true)
		{
			this.color = colors[output_color];
		}
	}
	//// Mute this module
	mute()
	{
		this.constructor._mutes[this.module] = true;
	}
	//// Unmute this module
	unmute()
	{
		this.constructor._mutes[this.module] = false;
	}
}

//==================================
// 		Static Field
//==================================
Log.initialize = function()
{
	var dir = "./logs";
	if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
	// Name of stdout file
	Log.output_file = `./logs/stdout-${Date().slice(0,-15)}.log`.replace(/[ :]/g, "-");
	// Name of stderr file
	Log.error_file = `./logs/stdout-${Date().slice(0,-15)}.log`.replace(/[ :]/g, "-");
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

Log.disable_colors = false;

// Initialize Log write streams and console outputs
Log.initialize();
// Map of modules that can be muted
Log._mutes = {};
// Static method to mute a log
Log.mute = function(module_name)
{
	// Check if log module name exists in _mutes structure
	if(module_name in Log._mutes)
	{
		Log._mutes[module_name] = true;
		return true;
	}
	return false;
};
// Static method to unmute an log
Log.unmute = function(module_name)
{
	// Check if log module name exists in _mutes structure
	if(module_name in Log._mutes)
	{
		Log._mutes[module_name] = false;
		return true;
	}
	return false;
};

module.exports = Log;