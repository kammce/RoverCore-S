'use strict';
// Check if the -h help
if(process.argv.indexOf("-h") != -1) {
	console.log(`NAME
	RoverCore - Start RoverCore

SYNOPSIS
	node RoverCore [-h]
	node RoverCore [-t http://address:port] [-s]

OPTIONS
	-h
		this parameter returns manual information

	-t, --target 	http://address:port
		This parameter sets the address of the Primus.js server that
		RoverCore will communicate with.
		Defaults to http://localhost:9000.

	-s, --simulate
		This parameter will replace every module with empty version
		in the modules folder with a Protolobe module. The Protolobe
		will have the name and idle charateristics of the module it
		is replacing. This is useful for testing communication
		between interface and modules. Data sent to protolobe will
		be echoed back to the server and sent to stdout (console).

	-i, --isolate "module" | "module1,moduel2,..."
		Isolate a particular lobe. For a single module, you need
		only put in the name. List of lobes must be comma
		seperated list without spaces.

	--no-color
		Disable log coloring in RoverCore.

	-v, -vv, -vvv
		Verbose output.
		-v will show debug level 1 messages.
		-vv will show debug level 1 and 2 messages.
		-vvv will show debug levels 1, 2 and 3 messages.
`);
	process.exit();
}
// =====================================
// Loading Libraries
// =====================================
console.log("Loading Libaries");
var Cortex = require("./modules/Cortex");
console.log("Loading Libaries COMPLETE");
// =====================================
// Check Arguments
// =====================================
console.log("Checking Arguments");
var config = {
	"target": 'http://localhost:9000',
	"connection": undefined,
	"simulate": false,
	"isolation": false,
	"debug_level": 0,
	"no_color": false,
};
if(process.argv.indexOf("-s") != -1)
{
	config.simulate = true;
}
if(process.argv.indexOf("-t") != -1)
{
	config.target = process.argv[process.argv.indexOf("-t")+1];
	console.log(`Target Proxy = ${config.target}`);
	// NOTE: Add Proxy connection here!
}
if(process.argv.indexOf("-i") != -1)
{
	config.isolation = process.argv[process.argv.indexOf("-i")+1];
	console.log(`Attempting to isolate ${config.isolation}`);
}

if(process.argv.indexOf("-v") != -1)
{
	config.debug_level = 1;
	console.log(`Debug Level set to ${config.debug_level}`);
}

if(process.argv.indexOf("-vv") != -1)
{
	config.debug_level = 2;
	console.log(`Debug Level set to ${config.debug_level}`);
}

if(process.argv.indexOf("-vvv") != -1)
{
	config.debug_level = 3;
	console.log(`Debug Level set to ${config.debug_level}`);
}

if(process.argv.indexOf("--no-color") != -1)
{
	config.no_color = true;
	console.log(`Disablimg log coloring in RoverCore-S.`);
}

console.log("Checking Arguments COMPLETE");
// =====================================
// Launching Cortex
// =====================================
console.log(`Launching Cortex!`);
new Cortex(config);