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
		
	var Socket = new Primus.createSocket();
	var connection = Socket('http://localhost:9999', {
		reconnect: {
			max: 2000, // Number: The max delay before we try to reconnect.
			min: 500, // Number: The minimum delay before we try reconnect.
			retries: Infinity // Number: How many times we shoult try to reconnect.
		}
	});
	var spark;
	describe('Testing Cortex Initialization', function () {
		it('Requiring Cortex Should be successful', function () {
			var Cortex = require('../../../modules/Cortex');
		});
		it('Initializating Cortex should connect to dummy server on reserved port 9999', function (done) {
			primus.on('connection', function connection(spark_obj) {
				spark = spark_obj; 
				spark.on('data', function(data) {
					// Skip the messages about Cortex modules IDLEing themselves. Look just for ones with "info" attributes
					if(data.hasOwnProperty("info")){
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
			
			var Cortex = require('../../../modules/Cortex');
			var cortex = new Cortex(connection, false);
		});
		it('Testing Cortex #loadLobes', function() {
			var cortex = new Cortex(connection, false);
			// Load protolobe config file
			var config = JSON.parse(fs.readFileSync(`./modules/Protolobe/config.json`));
			// Check if protolobe is in the lobe_map
			expect(cortex.lobe_map["Protolobe"]).to.exist();
			// Check if protolobe is in the lobe_map
			expect(cortex.lobe_map["Protolobe"].idle_time).to.equal(config['idle_time']);
			// Check if protolobe is in the lobe_map
			expect(cortex.lobe_map["Protolobe"].log_color).to.equal(config['log_color']);
			// Check if protolobe is in the lobe_map
			expect(cortex.lobe_map["Protolobe"].mission_controller).to.equal(config['mission_controller']);
		});
	});
	describe('Testing #handleIncomingData()', function () {
		var Cortex = require('../../../modules/Cortex');
		var cortex = new Cortex(connection, false);

		it('Lobe should receive target data from server', function (done) {
			cortex.lobe_map["Protolobe"]._react = function(data) {
				expect(data).to.equal("coldfustion");
				done();
			}
			spark.write({
				"target": 'Protolobe',
				"command": 'coldfustion'
			});
		});
		it('Lobe should halt when a mission controller disconnected signal is sent', function() {
			cortex.lobe_map["Protolobe"].state = "RUNNING";
			cortex.lobe_map["Protolobe"]._halt = function() {
				done();
			}
			spark.write({
				"target": 'ProtolobeUser',
				"connection": 'disconnected'
			});
		});
		it('Lobe should resume when a mission controller connected signal is sent', function() {
			cortex.lobe_map["Protolobe"].state = "HALTED";
			cortex.lobe_map["Protolobe"]._resume = function() {
				done();
			}
			spark.write({
				"target": 'ProtolobeUser',
				"connection": 'connected'
			});
		});
	});
	describe('Testing #handleIdleStatus()', function () {
		this.timeout(4000);
		var Cortex = require('../../../modules/Cortex');
		var cortex = new Cortex(connection, false);
		it('Should idle Protolobe after 2000ms of time', function (done) {
			spark.write({
				"target": 'ProtolobeUser',
				"command": 'ONLY ONE MESSAGE... SHOULD IDLE SOON.'
			});
			cortex.lobe_map["Protolobe"]._idle = function(data) {
				done();
			}
		});
		it('Should idle Protolobe after 2000ms of time', function (done) {
			var send_continuously = setInterval(function() {
				spark.write({
					"target": 'ProtolobeUser',
					"command": 'STAY UP! DO NOT IDLE!'
				});
			}, 500);
			setTimeout(function() {
				clearInterval(send_continuously);
				done();
			}, 3000);
		});
	});
});