"use strict";

describe('Testing Cortex Class', function () {
	// Loading Libraries
	var Primus = require('primus');
	var http = require('http');
	var fs = require('fs');
	var Cortex = require('../../../modules/Cortex');
	var server = http.createServer();

	var primus = new Primus(server, {
	  transformer: 'websockets'
	});

	server.listen(9999);

	var Socket = new Primus.createSocket();
	var connection, cortex, spark;

	describe('Cortex should initialize', function () {
		after(function() {
			primus.on('connection', function connection(spark_obj) {
				spark.on('data', function(data) {});
			});
		});
		it('Should connect to RoverCore server on port 9000', function (done) {
			this.timeout(5000);
			connection = Socket('http://localhost:9000', {
				reconnect: {
					max: 2000, // Number: The max delay before we try to reconnect.
					min: 500, // Number: The minimum delay before we try reconnect.
					retries: Infinity // Number: How many times we shoult try to reconnect.
				}
			});
			// Check that a Primus client can connect with server.
			connection.on('open', () => { done(); });
			var config = {
				"target": 'http://localhost:9000',
				"connection": undefined,
				"simulate": false,
				"isolation": false
			};
			cortex = new Cortex(config);
		});
		it('#loadLobes should load modules found in modules folder', function() {
			// Load protolobe config file
			var config = JSON.parse(fs.readFileSync(`./modules/Protolobe/config.json`));
			// Check if protolobe is in the lobe_map
			expect(cortex.lobe_map["Protolobe"]).to.exist;
			// Check if protolobe is in the lobe_map
			expect(cortex.lobe_map["Protolobe"].config.idle_time).to.equal(config['idle_time']);
			// Check if protolobe is in the lobe_map
			expect(cortex.lobe_map["Protolobe"].mission_controller).to.equal(config['mission_controller']);
		});
	});

	describe('Testing #handleIncomingData()', function () {
		var react, halt, resume, idle;
		beforeEach(function() {
			// Save methods
			react = cortex.lobe_map["Protolobe"]._react;
			halt = cortex.lobe_map["Protolobe"]._halt;
			resume = cortex.lobe_map["Protolobe"]._resume;
			idle = cortex.lobe_map["Protolobe"]._idle;
		});
		it('Lobe should receive target data from server', function (done) {
			cortex.lobe_map["Protolobe"]._react = function(data) {
				expect(data).to.equal("coldfustion");
				done();
			}
			connection.write({
				"target": 'Protolobe',
				"command": 'coldfustion'
			});
		});
		// it('Lobe should halt when a mission controller disconnected signal is sent', function(done) {
		// 	cortex.lobe_map["Protolobe"].state = "RUNNING";
		// 	cortex.lobe_map["Protolobe"]._halt = function() {
		// 		cortex.lobe_map["Protolobe"].state = "HALTED";
		// 		done();
		// 	}
		// 	connection.write({
		// 		"target": 'ProtolobeUser',
		// 		"connection": 'disconnected'
		// 	});
		// });
		// it('Lobe should resume when a mission controller connected signal is sent', function(done) {
		// 	cortex.lobe_map["Protolobe"].state = "HALTED";
		// 	cortex.lobe_map["Protolobe"]._resume = function() {
		// 		cortex.lobe_map["Protolobe"].state = "RUNNING";
		// 		done();
		// 	}
		// 	connection.write({
		// 		"target": 'ProtolobeUser',
		// 		"connection": 'connected'
		// 	});
		// });
		afterEach(function() {
			// Restore methods
			cortex.lobe_map["Protolobe"]._react = react;
			cortex.lobe_map["Protolobe"]._halt = halt;
			cortex.lobe_map["Protolobe"]._resume = resume;
			cortex.lobe_map["Protolobe"]._idle = idle;
		});
	});
	describe('Testing #handleIdleStatus()', function () {
		var react, halt, resume, idle;
		beforeEach(function() {
			// Save methods
			react = cortex.lobe_map["Protolobe"]._react;
			halt = cortex.lobe_map["Protolobe"]._halt;
			resume = cortex.lobe_map["Protolobe"]._resume;
			idle = cortex.lobe_map["Protolobe"]._idle;
		});
		this.timeout(4000);
		it('Should idle Protolobe after 2000ms of time', function (done) {
			cortex.lobe_map["Protolobe"].state = "RUNNING";
			connection.write({
				"target": 'Protolobe',
				"command": 'ONLY ONE MESSAGE... SHOULD IDLE SOON.'
			});
			cortex.lobe_map["Protolobe"]._idle = function() {
				cortex.lobe_map["Protolobe"].state = "IDLING";
				done();
			}
		});
		it('Should NOT idle Protolobe after 4000ms of time if signal is sent to it', function (done) {
			cortex.time_since_last_command["Protolobe"] = Date.now();
			cortex.lobe_map["Protolobe"].state = "RUNNING";
			cortex.lobe_map["Protolobe"]._idle = function() {
				throw new Error('Idle was executed!');
			}
			setTimeout(function() {
				clearInterval(send_continuously);
				done();
			}, 3000);
			var send_continuously = setInterval(function() {
				connection.write({
					"target": 'Protolobe',
					"command": 'STAY UP! DO NOT IDLE!'
				});
			}, 500);
		});
		afterEach(function() {
			// Restore methods
			cortex.lobe_map["Protolobe"]._react = react;
			cortex.lobe_map["Protolobe"]._halt = halt;
			cortex.lobe_map["Protolobe"]._resume = resume;
			cortex.lobe_map["Protolobe"]._idle = idle;
		});
	});
});