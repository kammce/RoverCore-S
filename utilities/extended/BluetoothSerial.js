"use strict";

var Serial = require('./Serial');

class BluetoothSerial extends Serial
{
	constructor(params)
	{
		params.path = `/dev/rfcomm${params.device}`;
		super(params);

		this.device = params.device;
		this.mac_address = params.mac;
		this.serial_buffer = "";
		this.callback_map = {};

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
	}
	//// @Override Superclass
	onPortData(data)
	{
		this.reference = this.reference || this;

		this.reference.serial_buffer += data.toString();
		var messages = this.reference.serial_buffer.split('\r\n');
		this.reference.log.output(this.reference.serial_buffer);
		//// Check if messages contains something
		if(messages.length > 1)
		{
			// this.reference.log.output(messages);
			for (var i = 0; i < messages.length-1; i++)
			{
				/* Regex pattern for format @<key>,<value>
				 * Store 1st match in key
				 * Store 2nd match in value
				 * Return empty array if exec fails to find matches
				 * In the event of a failed match, key & value = undefined
				 */
				var map = /^@([a-zA-Z0-9]),([\.\-0-9]+)$/g.exec(messages[i]) || [];
				if(map.length !== 3)
				{
					//this.log.output(`FAILED ON =${messages[i]}=`);
					continue;
				}
				var [, key, value] = map;
				/* Check if there exists a callback for this key.
				 * Check will fail if regex match failed.
				 * 		key is undefined, thus typeof will return "undefined".
				 */
				if(typeof this.reference.callback_map[key] === "function")
				{
					value = parseFloat(value);
					this.reference.callback_map[key](value);
				}
				else
				{
					this.reference.log.output("ERROR: COULD NOT BLUETOOTHSERIAL CALL FUNCTION HANDLER FOR 'KEY' = ", key);
				}
			}
			this.reference.serial_buffer = messages[messages.length-1];
		}
	}
	sendCommand(key, value)
	{
		var msg = `@${key.charAt(0)},${parseFloat(value)}\r\n`;
		this.send(msg);
		// this.log.output(msg);
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


BluetoothSerial.bt_agent_process = undefined;

//// For BlueZ5 bt-agent, for BlueZ4 bluetooth-agent
//// NOTE: Bluetooth-agent has different arguments
BluetoothSerial.bluetooth_agent = "bt-agent";
BluetoothSerial.bluetooth_pincode_path = "/tmp/BluetoothPincodes";

// "MAC Address": passkey/pin
BluetoothSerial.bluetooth_devices = `
00:21:13:00:71:0e 1234
00:21:13:00:6e:a7 1234
00:21:13:00:3b:03 1234
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
		console.log("bt-agent (Bluetooth Pincode Pairing Agent) closed! RESTARTING in 1s!");

		setTimeout(() =>
		{
			BluetoothSerial.spawnBTAgent(
				BluetoothSerial.bluetooth_agent,
				BluetoothSerial.bluetooth_pincode_path
			);
		}, 1000);
	});
};

BluetoothSerial.initialize = function()
{
	var execSync = require("child_process").execSync;
	var fs = require("fs");

	//// Kill all rfcomm processes before proceeding
	try { execSync('killall -9 rfcomm'); } catch(e) {}
	//// bt-agent requires two SIGTERM signals to terminate fully.
	//// 1st SIGTERM unregisters agent
	try { execSync('killall bt-agent'); } catch(e) {}
	//// 2nd SIGTERM kills bt-agent
	try { execSync('killall bt-agent'); } catch(e) {}
	//// 3rd Just to make sure
	try { execSync('killall bt-agent'); } catch(e) {}
	//// Release all bluetooth rfcomm connections
	try { execSync('rfcomm release all'); } catch(e) {}

	fs.writeFileSync(
		BluetoothSerial.bluetooth_pincode_path,
		BluetoothSerial.bluetooth_devices
	);

	// BluetoothSerial.spawnBTAgent(
	// 	BluetoothSerial.bluetooth_agent,
	// 	BluetoothSerial.bluetooth_pincode_path
	// );
};

BluetoothSerial.initialize();

module.exports = BluetoothSerial;