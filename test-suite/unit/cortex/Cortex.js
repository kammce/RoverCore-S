"use strict";

describe('End-to-End Cortex', function () {
	// Loading Libraries
	var Primus = require('primus');
	var http = require('http');
	var server = http.createServer();

	var primus = new Primus(server, { 
	  transformer: 'websockets' 
	});

	server.listen(9999);
		
	describe('Testing Cortex Initialization', function () {
		it('Requiring Cortex Should be successful', function () {
			var Cortex = require('../../../modules/Cortex');
		});
		it('Initializating Cortex should connect to dummy server on reserved port 9999', function (done) {
			primus.on('connection', function connection(spark) {
				spark.on('data', function(data) {
					// Skip the phase where Cortex IDLES all of the modules
					if(!data.hasOwnProperty("lobe")){
						expect(data).to.eql({
							intent: 'REGISTER', 
							info: { 
								entity: 'cortex', 
								password: 'destroyeveryone' 
							}
						});
						done();
					}
				});
			});
			
			var Socket = new Primus.createSocket();
			var Cortex = require('../../../modules/Cortex');

			var connection = Socket('http://localhost:9999', {
				reconnect: {
					max: 2000, // Number: The max delay before we try to reconnect.
					min: 500, // Number: The minimum delay before we try reconnect.
					retries: Infinity // Number: How many times we shoult try to reconnect.
				}
			});
			var cortex = new Cortex(connection);
		});
	});
	// TODO: create test for handleIdleStatus()
});