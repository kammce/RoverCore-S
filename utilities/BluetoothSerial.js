"use strict";

var Serial = require("./Serial");

class BluetoothSerial extends Serial
{
	constructor(params)
	{
		params.path = `/dev/rfcomm${params.device}`;
		params.delimiter = "\r\n";
		super(params);

		this.fs = require("fs");

		this.device = params.device;
		this.mac_address = params.mac;
		this.serial_buffer = "";
		this.callback_map = {};
		this.busy = true;

		// BluetoothSerial.bt_channel_iterator += 6;
		this.channel = 1;

		this.bind_command = `rfcomm bind ${this.device} ${this.mac_address} ${this.channel}`;
		this.bound = false;
		this.poll_counter = 0;

		this.pollling = setInterval(() =>
		{
			try
			{
				this.log.debug3(`this.port.isOpen = ${this.port.isOpen()}`);
				if(!this.busy && this.port.isOpen())
				{
					this.log.debug3("polling :: ", this.poll_counter++);
					this.sendCommand("~", this.poll_counter++);
				}
			}
			catch(e)
			{
				// ignore exceptions by Serial Port sending
			}
		}, 100);

		this.bind();
	}
	bind()
	{
		var rebind = () =>
		{
			setTimeout(() =>
			{
				this.bind();
			}, 1000);
		};
		//// Check if /dev/rfcommXX exists
		this.exec(`rfcomm show ${this.device}`, (error, stdout, stderr) =>
		{
			//// Binding already exists, just use it!
			var bind_match = `rfcomm${this.device}: ${this.mac_address} channel ${this.channel} `;
			this.log.debug2(bind_match);
			this.log.debug2(stdout);
			if(stdout.indexOf(bind_match) !== -1)
			{
				this.log.debug1(`RFCOMM BIND already exists, reusing port.`);
				this.setupSerial();
			}
			//// If stderr exists, then rfcomm devices does not exist
			else if(stderr)
			{
				this.exec(this.bind_command, (error) =>
				{
					if(error)
					{
						rebind();
					}
					else
					{
						this.log.debug1(`RFCOMM BIND successfully (ch=${this.channel}). Checking if ${this.path} exists.`);
						if(this.fs.existsSync(this.path))
						{
							this.log.debug1(`${this.path} exists, processing to setup serial communication in 1s.`);
							setTimeout(() =>
							{
								this.setupSerial();
								this.bound = true;
							}, 1000);
						}
						else
						{
							this.log.debug1(`${this.path} DOES NOT exist, attempting to bind again in 1s.`);
							rebind();
						}
					}
				});
			}
			//// If the rfcomm pattern did not match and stderr does not exist, then the rfcomm
			//// device exists but is wrong, thus release it to rebind it for this instance.
			else
			{
				this.log.debug1(`RFCOMM port does not match this one and exists. Releasing ${this.path}.`);
				this.release();
			}
		});
	}
	release()
	{
		this.busy = true;
		var release_callback = () =>
		{
			this.exec(`rfcomm release ${this.device}`, () =>
			{
				if(!this.fs.existsSync(this.path))
				{
					this.busy = false;
					//// NOT SURE IF I WANT TO DO THIS HERE!
					this.bind();
				}
			});
		};
		if(typeof this.port !== "undefined")
		{
			this.log.debug1(`Serial Port connection exists, attempting to close it, and release device.`);
			this.port.close(release_callback);
		}
		else
		{
			this.log.debug1(`Serial Port DOES NOT exists, proceeding to release device.`);
			release_callback();
		}
	}
	//// @Override Superclass
	onPortData(data)
	{
		this.reference = this.reference || this;

		//this.reference.serial_buffer += data.toString();
		//var messages = this.reference.serial_buffer.split("\r\n");

		var messages = data.toString();

		//this.reference.log.output(this.reference.serial_buffer);
		/* Regex pattern for format @<key>,<value>
		 * Store 1st match in key
		 * Store 2nd match in value
		 * Return empty array if exec fails to find matches
		 * In the event of a failed match, key & value = undefined
		 */
		var map = /^@([a-zA-Z0-9\*]),([\.\-0-9]+)$/g.exec(messages) || [];
		if(map.length === 3)
		{
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
				this.reference.log.debug1("ERROR: COULD NOT BLUETOOTHSERIAL CALL FUNCTION HANDLER FOR 'KEY' = ", key);
			}
		}
	}
	sendCommand(key, value)
	{
		var msg = `@${key.charAt(0)},${parseFloat(value)}|\r\n`;
		this.send(msg);
		this.log.debug2(`Bluetooth Send =`, msg);
	}
	attachListener(key, callback)
	{
		this.log.debug3(`Attaching listener to key ${key}`);
		if(/^[a-zA-Z0-9\*]$/g.test(key) && typeof callback === "function")
		{
			this.callback_map[key] = callback;
			return true;
		}
		return false;
	}
}


BluetoothSerial.bt_agent_process = null;
BluetoothSerial.bt_channel_iterator = 1;
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
98:D3:31:FC:4B:A9 1234
98:D3:31:FC:50:00 1234
98:D3:31:FC:4C:F5 1234
`;

BluetoothSerial.spawnBTAgent = function(agent_ps, code_path)
{
	var execSync = require("child_process").execSync;
	try
	{
		//// If this is successful then this method will return,
		//// Preventing additional bt-agents from being created!
		execSync("ps aux | grep [b]t-agent");
		console.log("BT-AGENT EXISTS: will not spawn another.");
	}
	catch(e)
	{
		console.log("BT-AGENT DOES NOT EXIST: will spawn bt-agent service.");
		//// Execution of ps aux failed, thus the process does not exist.
		var spawn = require("child_process").spawn;

		BluetoothSerial.bt_agent_process = spawn(agent_ps,
		[
			"--capability", "NoInputNoOutput",
			"--pin", code_path
		]);

		BluetoothSerial.bt_agent_process.on("close", (/*code*/) =>
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
	}
};

BluetoothSerial.initialize = function()
{
	var fs = require("fs");

	// var execSync = require("child_process").execSync;
	// var sleep = require("sleep");
	// var glob = require("glob");

	//// Release all bluetooth rfcomm connections
	// try
	// {
	// 	console.log("RUNNING: rfcomm release all");
	// 	var strerr = new Buffer("---");
	// 	while(strerr.toString() || glob.sync("/dev/rfcomm*").length !== 0)
	// 	{
	// 		strerr = execSync("rfcomm release all 2>&1");
	// 		//console.log(strerr.toString());

	// 		sleep.msleep(250);
	// 	}
	// 	console.log("FINISHED: rfcomm release all");
	// 	sleep.msleep(500);
	// }
	// catch(e) {}

	fs.writeFileSync(
		BluetoothSerial.bluetooth_pincode_path,
		BluetoothSerial.bluetooth_devices
	);

	BluetoothSerial.spawnBTAgent(
		BluetoothSerial.bluetooth_agent,
		BluetoothSerial.bluetooth_pincode_path
	);
};

BluetoothSerial.initialize();

module.exports = BluetoothSerial;
