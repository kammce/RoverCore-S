"use strict";

class BluetoothSerial
{
	constructor(params)
	{
		this.ready = false;
		this.port;
		this.log = params.log;
		this.serial_buffer = "";
		this.callback_map = {};
		this.device = params.device;
		this.mac_address = params.mac;
		this.baud_rate = params.baudRate;
		this.fs = require('fs');
		this.exec = require("child_process").exec;
		this.SerialPort = require("serialport");

		this.setupRFComm();
	}
	setupRFComm()
	{
		if(this.fs.existsSync(`/dev/rfcomm${this.device}`))
		{
			this.exec(`rfcomm release ${this.device}`, (error, stdout, stderr) =>
			{
				//// TODO: Code coverage
				if (error)
				{
					this.log.output(`exec error: ${error}`);
				}
				else
				{
					this.bind();
				}
			});
		}
		else { this.bind(); }
	}
	bind()
	{
		this.exec(`rfcomm bind ${this.device} ${this.mac_address}`, (error, stdout, stderr) =>
		{
			if (error)
			{
				this.log.output(`Bluetooth Serial RFCOMM BIND error: ${error}`);
			}
			else
			{
				this.setupSerial();
			}
		});
	};
	setupSerial()
	{
		this.port = new this.SerialPort(`/dev/rfcomm${this.device}`, {
			baudRate: this.baud_rate,
		});
		this.port.on("open", onPortOpen);
		this.port.on("data", onPortData);
		this.port.on("error", onPortError);
	};
	onPortOpen()
	{
		this.ready = true;
	}
	onPortData(data)
	{
		this.serial_buffer += data.toString();
		var split = this.serial_buffer.split('\r\n');
		if(split.length > 1)
		{
			for (var i = 0; i < split.length-1; i++)
			{
				if(/^@[a-zA-Z],[0-9\-]+$/g.test(split[i]))
				{
					var info = split[i].split(",");
					var key = info[0].charAt(1);
					var value = parseFloat(info[1]);
					if(typeof this.callback_map[key] === "function")
					{
						this.callback_map[key](value);
					}
					else
					{
						this.log.output("ERROR: COULD NOT BLUETOOTHSERIAL CALL FUNCTION HANDLER FOR 'KEY' = ", key);
					}
				}
			}
			this.serial_buffer = split[split.length-1];
		}
	}
	onPortError(err)
	{
		this.log.output(err);
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
		var msg = `@${key.charAt(0)},${parseFloat(value)}\r\n`;
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