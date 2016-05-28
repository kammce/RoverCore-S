"use strict";

var SerialPort = require('serialport');

var port;

var trys = 0;
var working;
const retryLimit = 50;

/* Serial Open Routine: will continously attempt to access the 
 * serialport until retry limit has been met. */
var serialOpenRoutine = (err) => {
    if(trys >= retryLimit) {
        return;
    } else if (err) { 
        console.log("Failed to open /dev/ttyACM0", trys);
        trys++;
        setTimeout(() => {
            console.log("Reattempting to open /dev/ttyACM0", trys);
            startSerial();
        }, 2000);
        return;
    } else {
        setTimeout(() => {
        	console.log("done");
            working = setInterval(function() {
            	console.log("working!");
            }, 250);
			// Listen for data on the serial port
			port.on('data', (data) => {
			    console.log("RECIEVED" + data.toString());
			});
			// Handle Error events by sending them back to mission control
			port.on("err", (err) => {
			    console.log("Communication error");
			});
			// Handle Error events by sending them back to mission control
			port.on("close", (err) => {
			    console.log("Communication close");
			});
			// Handle Error events by sending them back to mission control
			port.on("disconnect", (err) => {
			    console.log("Communication disconnect");
			    clearInterval(working);
			    startSerial();
			});
        }, 200);
    }
};
function startSerial() {
	var port = new SerialPort.SerialPort("/dev/ttyACM0", {
		baudrate: 9600,
		parser: SerialPort.parsers.readline('\n')
	}, false); // false = disable auto open
    port.open(serialOpenRoutine);
}

startSerial();