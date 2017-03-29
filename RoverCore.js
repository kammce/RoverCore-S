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
	"isolation": false
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
console.log("Checking Arguments COMPLETE");
// =====================================
// Launching Cortex
// =====================================
console.log(`Launching Cortex!`);
new Cortex(config);