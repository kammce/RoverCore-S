'use strict';

// Check if the -h help 
if(process.argv.indexOf("-h") != -1) {
	console.log(`NAME
       RoverCore.js - Start RoverCore

SYNOPSIS
       node RoverCore.js [-h]
       node RoverCore.js [-t http://address:port] [-s]

OPTIONS
       -h 
              this parameter returns manual information	

       -t, --target 	http://address:port
              This parameter sets the address of the Primus.js server that RoverCore 
              will communicate with.
              Defaults to http://localhost:9000.

       -s, --simulate
              This parameter will replace empty version of every module in 
              the modules folder with a Protolobe module. The Protolobe will 
              have the name and idle charateristics of the module it is replacing. 
              This is useful for testing communication between interface and
              modules. Data sent to protolobe will be echoed back to the server
              and sent to stdout (console).
`);
	process.exit();
} 

// Loading Primus
var Primus = require('primus');
console.log("Loading PrimusJS");
// Loading Cortex
var Cortex = require("./modules/Cortex");
console.log("Loading Cortex");

var Socket = new Primus.createSocket();
var simulate = false;
var target = 'http://localhost:9000';
var isolation;
var connection;
// Check for -s/--simulate argument
if(process.argv.indexOf("--simulate") != -1 || process.argv.indexOf("-s") != -1) {
	simulate = true;
}
// Check for -t/--target argument
if(process.argv.indexOf("-t") != -1) {
	target = process.argv[process.argv.indexOf("-t")+1];
	console.log(`Target Server = ${target}`);
} else if(process.argv.indexOf("--target") != -1) {
	target = process.argv[process.argv.indexOf("--target")+1];
	console.log(`Target Server = ${target}`);
}
// Check for -i/--isolate argument
if(process.argv.indexOf("-i") != -1) {
       isolation = process.argv[process.argv.indexOf("-i")+1];
       console.log(`Attempting to isolate ${isolation}`);
} else if(process.argv.indexOf("--isolate") != -1) {
       isolation = process.argv[process.argv.indexOf("--isolate")+1];
       console.log(`Attempting to isolate ${isolation}`);
}

console.log(`Setting up socket communication on ${target}`);
connection = Socket(target, { 
	reconnect: {
		max: 2000, // Number: The max delay before we try to reconnect.
		min: 500, // Number: The minimum delay before we try reconnect.
		retries: Infinity // Number: How many times we shoult try to reconnect.
	}
});

console.log(`Launching Cortex!`);
new Cortex(connection, simulate, isolation);