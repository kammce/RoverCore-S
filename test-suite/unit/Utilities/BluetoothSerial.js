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

			unit_test.attachListener('A', function(value)
			{
				console.log(`key[A] = ${value}`);
			});
			unit_test.attachListener('B', function(value)
			{
				console.log(`key[B] = ${value}`);
			});
			unit_test.attachListener('C', function(value)
			{
				console.log(`key[C] = ${value}`);
			});
			unit_test.attachListener('S', function(value)
			{
				console.log(`key[S] = ${value}`);
			});

			var a = 1;

			setInterval(function() {
				unit_test.send("Z", a++);
			}, 250);
		});
	});
});
