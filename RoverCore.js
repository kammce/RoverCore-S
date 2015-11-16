'use strict';

// Loading Libraries
var Primus = require('primus');
var Socket = new Primus.createSocket();
var connection = Socket('http://localhost:9000', { 
	reconnect: {
		max: 2000, // Number: The max delay before we try to reconnect.
		min: 500, // Number: The minimum delay before we try reconnect.
		retries: Infinity // Number: How many times we shoult try to reconnect.
	}
});

var Cortex = require("./modules/Cortex");

// Construct and start Cortex
new Cortex(connection);
