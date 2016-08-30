"use strict";

var http = require('http');
var server = http.createServer();

var Primus = require('primus');
var primus = new Primus(server, {
  transformer: 'websockets'
});

primus.on('connection', function connection(spark) {
	console.log('connection was made from', spark.address);
	console.log('connection id', spark.id);
	var send_protolobe;
	spark.on('data', function(data) {
		console.log('PRINTED FROM SERVER:', data);
	});
	send_protolobe = setInterval(function() {
		spark.write({
			target: 'Protolobe',
			command: 'test_data'
		});
	}, 2000);
	send_protolobe = setInterval(function() {
		spark.write({
			target: 'Simulation',
			command: 'test_data_simulation'
		});
	}, 2000);
	spark.on('end', function(data) {
		console.log('disconnect from', spark.address);
		console.log('disconnect id', spark.id);
		clearInterval(send_protolobe);
	});
});

var port = 9000;
server.listen(port);
console.log(`Server has started listening on port ${port}`);