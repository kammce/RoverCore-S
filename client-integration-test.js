"use strict";
var Primus = require('primus');
var Socket = new Primus.createSocket();
var connection = Socket('http://localhost:9000', {
	reconnect: {
		max: 2000, // Number: The max delay before we try to reconnect.
		min: 500, // Number: The minimum delay before we try reconnect.
		retries: Infinity // Number: How many times we shoult try to reconnect.
	}
});

/** Connect to Signal Relay **/
// Cortex should act as a client and connect to Signal
// Relayusing primus.js and websockets as the transport.
var send_protolobe;
connection.on('open', () =>
{
	console.log('Connected to RoverCore!');
	send_protolobe = setInterval(function() {
		connection.write({
			target: 'Protolobe',
			command: 'test_data'
		});
	}, 2000);
	connection.write(
	{
		target: 'Cortex',
		command:
		{
			login: 'ProtolobeUser',
		}
	});
	console.log("CONNECTED! I AM HERE!");
});
connection.on('data', (data) =>
{
	console.log('PRINTED FROM SERVER:', data);
});
connection.on('error',  (err) =>
{
	console.log('CONNECTION error!', err.stack);
});
connection.on('reconnect', () =>
{
	console.log('RECONNECTION attempt started!');
});
connection.on('reconnect scheduled', (opts) =>
{
	console.log(`Reconnecting in ${opts.scheduled} ms`);
	console.log(`This is attempt ${opts.attempt} out of ${opts.retries}`);
});
connection.on('reconnected', (opts) =>
{
	console.log(`It took ${opts.duration} ms to reconnect`);
});
connection.on('reconnect timeout', (err) =>
{
	console.log(`Timeout expired: ${err.message}`);
});
connection.on('reconnect failed', (err) =>
{
	console.log(`The reconnection failed: ${err.message}`);
});
connection.on('end', () =>
{
	console.log('Disconnected from RoverCore');
	clearInterval(send_protolobe);
});
