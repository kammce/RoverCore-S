"use strict";

function Neuron(uart) {
	this.os = require('os');
	//this.available_uarts = [ "/dev/ttyO1", "/dev/ttyO2", "/dev/ttyO4", "/dev/ttyO5" ];
	if(this.os == 'beaglebone') {
		console.log("System Hostname is Beaglebone");
	} else {
		console.log("Running on none Beagblebone platform.");
		return;
	}
	this.uart = (_.isUndefined(uart)) ? "/dev/ttyACM0" : uart;
	console.log("Checking if UARTS are enabled");

	this.ReadStream = undefined;
	this.WriteStream = undefined;
	this.buffer = "";
	this.log = "";
	
	this.onReceive = function (data) {
		parent.buffer += data;
	};
	this.onClose = function () {
		console.log(parent.uart+" Connection Closed");
		parent.connection = parent.CommunicationState.DISCONNECTED;
		parent.WriteStream.end();
		parent.connect();
	};
	this.onWError = function (err) {
		console.log(parent.uart+" Connection Write Error, Host may be down. Connection Closed.");
		parent.connection = parent.CommunicationState.DISCONNECTED;
		parent.WriteStream.end();
	};
	this.onRError = function (err) {
		console.log(parent.uart+" Connection Read Error, Host may be down. Connection Closed.");
		parent.connection = parent.CommunicationState.DISCONNECTED;
		parent.WriteStream.end();
		parent.connect();
	};
}
Neuron.prototype.flush = function() {
	parent.buffer = "";
};
Neuron.prototype.send = function(msg) {
	this.WriteStream.write(msg);
};
Neuron.prototype.connect = function(uart) {
	var parent = this;

	if(objExists(this.ReadStream)) {
		delete this.ReadStream;
		delete this.WriteStream;
		console.log("Attempting to reconnect to "+this.uart);
	} else {
		console.log("Attempting to connect to "+this.uart);
	}

	this.WriteStream = fs.createWriteStream(this.device);
	this.WriteStream.on('error', this.onWError);

	this.ReadStream = fs.createReadStream(this.device);
	this.ReadStream.setEncoding('ascii');
	this.ReadStream.on('data', this.onReceive);
	this.ReadStream.on('close', this.onClose);
	this.ReadStream.on('error', this.onRError);

	delete parent.ReadStream;
	delete parent.WriteStream;
};

module.exports = exports = MindController;