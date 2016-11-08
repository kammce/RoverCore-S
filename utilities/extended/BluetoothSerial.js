"use strict";

var SerialPort = require("serialport");
var exec = require("child_process").exec;
var fs = require('fs');

class BluetoothSerial
{
	constructor(params)
	{
		this.ready = false;
		this.port;
		this.log = params.log;
		this.callback = params.callback;
		this.serialbuffer = "";
		var setup_serial = () =>
		{
			this.port = new SerialPort(`/dev/rfcomm${params.dev}`, {
				baudRate: params.baud,
			});
			this.port.on("open", () =>
			{
				this.ready = true;
			});
			this.port.on("data", (data) =>
			{
				this.serialbuffer += data.toString();
				var split = this.serialbuffer.split('\n');
				if(split.length > 1)
				{
					for (var i = 0; i < split.length-1; i++)
					{
						this.log(/\([0-9]+\)HEARTBEAT/g.match(split[i]));
						this.callback(split[i]);
					}
					this.serialbuffer = split[split.length-1];
				}
			});
			this.port.on("error", (err) =>
			{
				this.log.output(err);
			});
		};
		var bind = () =>
		{
			//Mac_Addr, Baudrate, Log, Device_Number, callback
			exec(`rfcomm bind ${params.dev} ${params.mac}`, (error, stdout, stderr) =>
			{
				if (error)
				{
					this.log.output(`exec error: ${error}`);
				}
				else
				{
					setup_serial();
				}
			});
		};
		if(fs.existsSync(`/dev/rfcomm${params.dev}`))
		{
			exec(`rfcomm release ${params.dev}`, (error, stdout, stderr) =>
			{
				if (error)
				{
					this.log.output(`exec error: ${error}`);
				}
				else
				{
					bind();
				}
			});
		}
		else { bind(); }
	}
	sendraw(msg)
	{
		if(this.ready)
		{
			this.port.write(msg);
		}
	}
	send(key, value)
	{
		if(this.ready)
		{
			var msg = `@${key.charAt(0)},${value}\n`;
			this.port.write(msg);
		}
	}
	attachListener(key, value)
	{
		var msg = `@${key},{value}\n`;
		this.port.write(msg);
	}
}

module.exports = BluetoothSerial;