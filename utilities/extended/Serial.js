"use strict";

class Serial
{
	constructor(params)
	{
		// this.connected = false;
		// this.port;
		this.log = params.log;
		this.path = params.path;
		this.baud_rate = params.baud;
		this.delimiter = params.delimiter;
		this.fs = require('fs');
		this.exec = require("child_process").exec;
		this.SerialPort = require("serialport");
		this.connection_interval = undefined;
		this.initial_setup = false;
	}
	setupSerial()
	{
		var options = {
			baudRate: this.baud_rate,
			autoOpen: false
		};

		if(typeof this.delimiter === "string")
		{
			options['parser'] = this.SerialPort.parsers.readline(this.delimiter);
		}

		this.port = new this.SerialPort(this.path, options);
		this.port.on("open",  this.onPortOpen);
		this.port.on("data",  this.onPortData);
		this.port.on("error", this.onPortError);
		this.port.log = this.log;
		/* The following line attaches a reference of THIS instance of
		 * the Serial class to the newly made SerialPort Object.
		 * This is needed because the SerialPort callbacks only see the
		 * reference of the SerialPort object and not the Serial Object.
		 * This will allow the listeners to reference the Serial object.
		 */
		this.port.reference = this;
		//// Open Serial Port
		this.port.open();

		this.initial_setup = true;

		this.connection_interval = setInterval(() =>
		{
			try
			{
				if(!this.port.isOpen() && this.initial_setup)
				{
					this.log.debug1(`Connection failed, attempting to open connection to ${this.path}`);
					this.port.open();
				}
				if(this.port.isOpen())
				{

				}
			}
			catch(e)
			{
				this.log.debug1(e);
			}
		}, 2000);
	}
	//// Children should override this function
	onPortOpen()
	{
		this.reference = this.reference || this;
		this.log.output(`Opening connection to ${this.path}`);
		// this.log.port.write("CONNECT");
		// this.reference.ready = true;
	}
	//// Children should override this function
	onPortData(data)
	{
		this.reference = this.reference || this;
		this.reference.log.output(data.toString());
	}
	//// Children should override this function
	onPortError(err)
	{
		this.reference = this.reference || this;
		this.reference.log.output(err);
		// if(err.toString().indexOf("Error: Port is not open") !== -1)
		// {
		// 	this.reference.ready = false;
		// }
	}
	send(msg)
	{
		try
		{
			if(this.port.isOpen())
			{
				this.port.write(msg);
			}
		}
		catch(e)
		{
			this.log.debug1(e);
		}
	}
	attachListener(key, callback)
	{
		if(/^[a-zA-Z0-9]$/g.test(key) && typeof callback === 'function')
		{
			this.callback_map[key] = callback;
			return true;
		}
		return false;
	}
}

module.exports = Serial;