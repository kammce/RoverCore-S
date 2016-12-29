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
		this.callback_map = {};
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
				console.log(this.serialbuffer);
				var split = this.serialbuffer.split('\n');
				if(split.length > 1)
				{
					for (var i = 0; i < split.length-1; i++)
					{
						if(/^@[a-zA-Z],[0-9\-]+$/g.test(split[i]))
						{
							var info = split[i].split(",");
							var key = info[0].charAt(1);
							var value = parseFloat(info[1]);
							//console.log(info);
							if(typeof this.callback_map[key] === "function")
							{
								this.callback_map[key](value);
							}
							else
							{
								console.log("ERROR: COULD NOT CALL FUNCTION HANDLER FOR 'KEY' = ", key);
							}
						}
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
		var msg = `@${key.charAt(0)},${parseFloat(value)}\n`;
		this.sendraw(msg);
	}
	attachListener(key, callback)
	{
		if(/^[a-zA-Z]$/g.test(key) && typeof callback === 'function')
		{
			this.callback_map[key] = callback;
			return true;
		}
		return false;
	}
}

module.exports = BluetoothSerial;