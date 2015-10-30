'use strict';

// Loading Libraries
var Primus = require('primus');
var Socket = new Primus.createSocket();
var connection = Socket('http://localhost:9000');
var Cortex = require("./modules/Cortex");

// Construct and start cortex
new Cortex(connection);

/*{ reconnect: {
	max: 4000, // Number: The max delay before we try to reconnect.
	min: 500, // Number: The minimum delay before we try reconnect.
	retries: Infinity // Number: How many times we shoult try to reconnect.
}*/