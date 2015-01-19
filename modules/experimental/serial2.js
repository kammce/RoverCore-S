"use strict";

var fs = require('fs');
var UART = require('./neuron.js');
//var uart = new UART('/dev/ttyACM0');

var SERIALPORT = require('serialport');
var serialPort = new serialport.SerialPort("/dev/ttyACM0",
{//Listening on the serial port for data coming from Arduino over USB
	parser: serialport.parsers.readline('\n')
});

var querystring = require('querystring');
serialPort.on('data', function (data)
{//When a new line of text is received from Arduino over USB
	try
	{
		console.log(data);
	}
	catch (ex)
	{
		console.warn(ex);
	}
});