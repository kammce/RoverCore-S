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
		this.baud_rate = params.baud;
		this.fs = require('fs');
		this.exec = require("child_process").exec;
		this.SerialPort = require("serialport");

		this.bind();
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
			autoOpen: false
		});
		this.port.on("open", this.onPortOpen);
		this.port.on("data", this.onPortData);
		this.port.on("error", this.onPortError);
		this.port.open();
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


BluetoothSerial.bt_agent_process = undefined;

//// For BlueZ5 bt-agent, for BlueZ4 bluetooth-agent
//// NOTE: Bluetooth-agent has different arguments
BluetoothSerial.bluetooth_agent = "bt-agent";
BluetoothSerial.bluetooth_pincode_path = "/tmp/BluetoothPincodes";

// "MAC Address": passkey/pin
BluetoothSerial.bluetooth_devices = `
00:21:13:00:71:0e 1234
00:21:13:00:6e:a7 1234
00:21:13:00:72:ba 1234
00:21:13:00:71:a1 1234
00:21:13:00:6f:a7 1234
00:21:13:00:71:57 1234
`;

BluetoothSerial.spawnBTAgent = function(agent_ps, code_path)
{
	var spawn = require("child_process").spawn;

	BluetoothSerial.bt_agent_process = spawn(agent_ps,
	[
		"--capability", "NoInputNoOutput",
		"--pin", code_path
	]);
	BluetoothSerial.bt_agent_process.on('close', (code) =>
	{
		//// NOTE: Could be potentially dangerous :P
		//// Recursion mang!

		console.log("bt-agent (Bluetooth Pincode Pairing Agent) closed! RESTARTING NOW!");

		BluetoothSerial.spawnBTAgent(
			BluetoothSerial.bluetooth_agent,
			BluetoothSerial.bluetooth_pincode_path
		);
	});
};

BluetoothSerial.initialize = function()
{
	var execSync = require("child_process").execSync;
	var fs = require("fs");

	//// Release all bluetooth rfcomm connections
	try { execSync('rfcomm release all'); } catch(e) {}
	//// bt-agent requires two SIGTERM signals to terminate fully.
	//// 1st SIGTERM unregisters agent
	try { execSync('killall bt-agent'); } catch(e) {}
	//// 2nd SIGTERM kills bt-agent
	try { execSync('killall bt-agent'); } catch(e) {}
	//// 3rd Just to make sure
	try { execSync('killall bt-agent'); } catch(e) {}
	//// Kill all rfcomm processes before proceeding
	try { execSync('killall -9 rfcomm'); } catch(e) {}

	fs.writeFileSync(
		BluetoothSerial.bluetooth_pincode_path,
		BluetoothSerial.bluetooth_devices
	);

	BluetoothSerial.spawnBTAgent(
		BluetoothSerial.bluetooth_agent,
		BluetoothSerial.bluetooth_pincode_path
	);
};

module.exports = BluetoothSerial;