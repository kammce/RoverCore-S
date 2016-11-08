"use strict";

describe('Testing BluetoothSerial Class', function ()
{
	// =====================================
	// Loading Libraries
	// =====================================
	var BluetoothSerial = require('../../../utilities/extended/BluetoothSerial');
	var Log = require('../../../utilities/Log');
	var log = new Log("BluetoothSerial", "blue");
	// =====================================
	// Unit test global variables
	// =====================================
	var connection, unit_test, spark;

	describe('BluetoothSerial constructor', function ()
	{
		this.timeout(50000);
		it('should initialize', function (done)
		{
			unit_test = new BluetoothSerial({
				mac: "30:14:06:24:01:80",
				baud: 9600,
				log: log,
				dev: 1,
				callback: function(data)
				{
					log.output(data);
				}
			});

			setInterval(function() {
				unit_test.send("A", 5.5243);
			}, 1000);
		});
	});
});
