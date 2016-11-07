"use strict";

var Model = require('../../../utilities/Model');

describe('Testing Model Class', function () {
	// Loading Libraries
	var Primus = require('primus');
	var http = require('http');
	var server = http.createServer();

	var primus = new Primus(server, {
		transformer: 'websockets'
	});

	server.listen(9998);

	var feedback = function() {};

	var test_unit = new Model(feedback);

	describe('Testing Methods', function () {
		it('#registerMemory("TEST_UNIT") should have key "TEST_UNIT" in database', function (done) {
			test_unit.registerMemory("TEST_UNIT");
			setTimeout(function() {
				expect(test_unit.database['TEST_UNIT']).to.be.ok;
				expect(test_unit.database['TEST_UNIT']['timestamp']).to.be.a('number');
				expect(test_unit.database['TEST_UNIT']['timestamp']).to.be.above(test_unit.epoch);
				done();
			}, 50);
		});
		it('#set() sets internal database to appropriate value', function () {
			test_unit.set("TEST_UNIT", 'SET_TEST_VALUE');
			expect(test_unit.database['TEST_UNIT']['value']).to.equal('SET_TEST_VALUE');
			expect(test_unit.database['TEST_UNIT']['timestamp']).to.be.above(test_unit.epoch);
		});
		it('#get() returns expected value from database', function () {
			test_unit.set("TEST_UNIT", 'GET_TEST_VALUE');
			var time_before_get = test_unit.database['TEST_UNIT']['timestamp'];
			var result = test_unit.get("TEST_UNIT");
			var time_after_get = test_unit.database['TEST_UNIT']['timestamp'];
			// Expect returned value to be equal to value in database
			expect(result).to.equal(test_unit.database['TEST_UNIT']['value']);
			// Expect returned value to be equal to what was 'set' in database
			expect(result).to.equal('GET_TEST_VALUE');
			// Timestamp should not be altered by get operation
			expect(time_after_get).to.equal(time_before_get);
		});
		it('#getMemory() returns the full database', function () {
			// Flush database
			test_unit.database = {};
			// Register Memory two items into memory
			test_unit.registerMemory("TEST_UNIT0");
			test_unit.registerMemory("TEST_UNIT1");
			// Values to be set
			test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit.database['TEST_UNIT0']['timestamp'] = 0;
			test_unit.database['TEST_UNIT1']['timestamp'] = 0;

			expect(test_unit.database).to.eql({
				"TEST_UNIT0": {
					timestamp: 0,
					value: 'SET_TEST_VALUE0'
				},
				"TEST_UNIT1": {
					timestamp: 0,
					value: 'SET_TEST_VALUE1'
				}
			});
		});
	});

	describe('Testing #getMemory() with input timestamping', function () {

		it('#getMemory() returns full database with 0 timestamp', function () {
			// Flush database
			test_unit.database = {};
			// Register Memory two items into memory
			test_unit.registerMemory("TEST_UNIT0");
			test_unit.registerMemory("TEST_UNIT1");
			// Values to be set
			test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit.database['TEST_UNIT0']['timestamp'] = 0;
			test_unit.database['TEST_UNIT1']['timestamp'] = 0;

			var full_database = test_unit.getMemory(0);

			expect(full_database).to.eql({
				"TEST_UNIT0": {
					timestamp: 0,
					value: 'SET_TEST_VALUE0'
				},
				"TEST_UNIT1": {
					timestamp: 0,
					value: 'SET_TEST_VALUE1'
				}
			});
		});
		it('#getMemory() returns empty with timestamp 1 day in the future', function () {
			// Flush database
			test_unit.database = {};
			// Register Memory two items into memory
			test_unit.registerMemory("TEST_UNIT0");
			test_unit.registerMemory("TEST_UNIT1");
			// Values to be set
			test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit.database['TEST_UNIT0']['timestamp'] = test_unit.epoch;
			test_unit.database['TEST_UNIT1']['timestamp'] = test_unit.epoch;
			// One day in milliseconds = 86400000
			var empty_structure = test_unit.getMemory((new Date())+86400000);
			// Returned value is empty structure
			expect(empty_structure).to.eql({});
		});
		it('#getMemory() should only return updated items', function () {
			// Flush database
			test_unit.database = {};
			// Register Memory two items into memory
			test_unit.registerMemory("TEST_UNIT0");
			test_unit.registerMemory("TEST_UNIT1");
			// Values to be set
			test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit.database['TEST_UNIT0']['timestamp'] = test_unit.epoch;
			test_unit.database['TEST_UNIT1']['timestamp'] = test_unit.epoch-100;
			// One day in milliseconds = 86400000
			var empty_structure = test_unit.getMemory(test_unit.epoch);
			// Returned value should be
			expect(empty_structure).to.eql({
				"TEST_UNIT0": {
					timestamp: test_unit.epoch,
					value: 'SET_TEST_VALUE0'
				}
			});
		});
	});

	describe('Testing Realtime feedback', function () {
		it('#set() should send message to server', function (done) {
			var real_feedback = function(lobe_name) {
				var output = "";
				for (var i = 1; i < arguments.length; i++) {
					if(typeof arguments[i] === "object") {
						output += JSON.stringify(arguments[i])+"\n";
					} else {
						output += arguments[i]+"\n";
					}
				}
				connection.write({
					lobe: lobe_name,
					message: output
				});
			};

			// setup primus connection
			primus.on('connection', function connection(spark) {
				spark.on('data', function(data) {
					// FORCE set timestamp to 0 for consistancy
					data['message'] = JSON.parse(data['message']);
					data['message']['TEST_UNIT0']['timestamp'] = 0;
					data['message'] = JSON.stringify(data['message']);
					expect(data).to.eql({
						lobe: "model",
						message: JSON.stringify({
							"TEST_UNIT0": {
								timestamp: 0,
								value: 'SET_TEST_VALUE0'
							}
						})
					});
					done();
				});
			});

			var Socket = new Primus.createSocket();

			var connection = Socket('http://localhost:9998', {
				reconnect: {
					max: 2000, // Number: The max delay before we try to reconnect.
					min: 500, // Number: The minimum delay before we try reconnect.
					retries: Infinity // Number: How many times we shoult try to reconnect.
				}
			});

			var test_unit0 = new Model(real_feedback);
			// Flush database
			test_unit0.database = {};
			// Register Memory two items into memory
			test_unit0.registerMemory("TEST_UNIT0");
			// Values to be set
			test_unit0.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit0.database['TEST_UNIT0']['timestamp'] = 0;

		});
	});
});
