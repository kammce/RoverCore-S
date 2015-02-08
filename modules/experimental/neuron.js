"use strict";

function Neuron(uart) {
	this.os = require('os');
	this.fs = require("fs");
	//this.available_uarts = [ "/dev/ttyO1", "/dev/ttyO2", "/dev/ttyO4", "/dev/ttyO5" ];
/*	if(this.os == 'beaglebone') {
		console.log("System Hostname is Beaglebone");
	} else {
		console.log("Running on none Beagblebone platform.");
		return;
	}*/
	this.uart = (typeof uart == "undefined") ? "/dev/ttyACM0" : uart;
	console.log("Checking if UARTS are enabled");

	this.ReadStream = undefined;
	this.WriteStream = undefined;
	this.buffer = "";
	this.log = "";

	var parent = this;
	
	this.onReceive = function (data) {
		parent.buffer += data;
		console.log(data);
	};
	this.onClose = function () {
		console.log(parent.uart+" Connection Closed");
		//parent.WriteStream.end();
		parent.reconnect();
	};
	this.onWError = function (err) {
		console.log(parent.uart+" Connection Write Error, Host may be down. Connection Closed.");
		//parent.WriteStream.end();
	};
	this.onRError = function (err) {
		console.log(parent.uart+" Connection Read Error, Host may be down. Connection Closed.");
		//parent.WriteStream.end();
		parent.reconnect();
	};

	console.log("Connecting to "+this.uart);

	var parent = this;
	setTimeout(function() {
		delete parent.ReadStream;
		delete parent.WriteStream;

		parent.ReadStream = parent.fs.createReadStream(parent.uart);
		parent.ReadStream.setEncoding('ascii');
		parent.ReadStream.on('data', parent.onReceive);
		parent.ReadStream.on('close', parent.onClose);
		parent.ReadStream.on('error', parent.onRError);

		//parent.WriteStream = parent.fs.createWriteStream(parent.uart);
		//parent.WriteStream.on('error', parent.onWError);
	}, 3000);
}
Neuron.prototype.flush = function() {
	parent.buffer = "";
};
Neuron.prototype.send = function(msg) {
	this.WriteStream.write(msg);
};
Neuron.prototype.reconnect = function() {
	var parent = this;
	setTimeout(function() {
		delete parent.ReadStream;
		delete parent.WriteStream;

		parent.ReadStream = parent.fs.createReadStream(parent.uart);
		parent.ReadStream.setEncoding('ascii');
		parent.ReadStream.on('data', parent.onReceive);
		parent.ReadStream.on('close', parent.onClose);
		parent.ReadStream.on('error', parent.onRError);

		//parent.WriteStream = parent.fs.createWriteStream(parent.uart);
		//parent.WriteStream.on('error', parent.onWError);
	}, 3000);
}

module.exports = exports = Neuron;