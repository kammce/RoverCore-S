"use strict";
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
//MX-64AR VCC=12V, LC Electronics rs485 Uart converter VCC=5V
/*Includes*/
var SerialPort = require("serialport").SerialPort;
var input = process.argv;

/*Globals*/
var defaultSet = false;
var iterations = 0;
/*SerialPort Communication*/
/*For use in actual rover, controlled thru BeagleBone Black*/
// var serial = new SERIALPORT.SerialPort("for/path/to/uart/device,/See_READMEarm.txt", {
//     baudrate: 57600
// });
/*For use in local system testing; Read/Write stream to USB*/
var serial = new SerialPort("/dev/ttyACM1", {
    baudrate: 57600
});
//Value Codes
var ON = 0x01,
	OFF = 0x00;
//Instruction Codes
var PING = 0X01,
    READ = 0x02,
    WRITE = 0x03,
    REGWRITE = 0X04,
    ACTION = 0X05;
//Motor IDs **NOTE:ALL == broadcast to all motors for execution
var ALL = 0xFE,
    BASE = 0x00,
    LEFTSHOULDER = 0x01,
    RIGHTSHOULDER = 0x02,
    ELBOW = 0x03,
    WRIST = 0x04;
//Servo Register Addresses
var POSITION = 0x1E,
    SPEED = 0x20,
    CCW = 0x08,
    CW = 0x06,
    TORQUE = 0x18, //Used to enable motor movement
    LED = 0x19;

/*Initiate Serialport*/
	serial.on('open', function(err) {
	    if(err){
	    	console.log(err);
	    }
	    else{
	    	console.log('>>SerialPort is Open<<'); //For Debugging
	    	armController(input[2]);
	    	// serial.close();
	    }
	});
	serial.on('error', function(err){
		console.log(err);
	});

function armController(input) { //Info is an object, with members outlined when sending control signals via arm interface html
		console.log("Enabling Torque");
		control(WRITE, ALL, TORQUE, ON); //highbyte not used, set to default 0xFFFF
		var hexdeg = (input/360) * 4095;
		if(hexdeg > 4095){
			hexdeg = 4095;
		}
		if(hexdeg < 0){
			hexdeg = 0;
		}
		var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
		var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
		console.log("H:" + high + "  L:" + low);
		control(WRITE, ALL, POSITION, low, high);
};

function control(instruction, motorID, register, lowbyte, highbyte){ //parameters==object with motor IDs and values, use member finding to determine what to do
	console.log("Moving Motor " + motorID);
	highbyte = highbyte || 0xFFFF; //Sets highbyte to a default of 65535 unless otherwise specified (i.e. position commands require low and highbyte whereas torque and led commands require only one value byte, making highbyte unused)
	var command = ""; //Command string. Servos read bytes; Strings are valid ways to send them
	var length = 0;
	var checksum = 0;
	if(highbyte != 0xFFFF){ //If the highbyte value was specified, i.e. used in function call
		length = 3+2; //(register address, lowbyte, highbyte) + (instruction byte, checksum)
	}
	else{
		length = 2+2; //(register address, value byte) + (instruction byte, checksum)
	}
	/*Put the control packet together*/
	/*Method 1: Send piece by piece*/ //Reflects Arduino Version of armDriver
	checksum = motorID + length + instruction + register + lowbyte; //Assumes command is not PING, which uses neither lowbyte nor highbyte
	if(highbyte != 0xFFFF){
		checksum += parseInt(highbyte);
	}
	checksum = ~checksum & 0xFF;
		var ox = String.fromCharCode(0xFF); //ÿ Signature Byte Char
		var id = String.fromCharCode(motorID); //ID Byte Char
		var ln = String.fromCharCode(length); //Length Byte Char
		var cmd = String.fromCharCode(instruction); //Instruction Byte Char
		var addr = String.fromCharCode(register); //Register Address Byte Char
		var lb = String.fromCharCode(lowbyte); //Value/Lowbyte (depends on function call)
		var hb = String.fromCharCode(highbyte); //Highbyte
		var chk = String.fromCharCode(checksum); //Checksum
	if(highbyte != 0xFFFF){
		serial.write(ox); //ÿ Signature Byte Char
		serial.write(ox); //ÿ Signature Byte Char
		serial.write(id); //ID Byte Char
		serial.write(ln); //Length Byte Char
		serial.write(cmd); //Instruction Byte Char
		serial.write(addr); //Register Address Byte Char
		serial.write(lb); //Value/Lowbyte (depends on function call)
		serial.write(hb); //Highbyte
		serial.write(chk, function(err, results){
			// serial.close();
		}); //Checksum
	}
	else{
		serial.write(ox); //ÿ Signature Byte Char
		serial.write(ox); //ÿ Signature Byte Char
		serial.write(id); //ID Byte Char
		serial.write(ln); //Length Byte Char
		serial.write(cmd); //Instruction Byte Char
		serial.write(addr); //Register Address Byte Char
		serial.write(lb); //Value/Lowbyte (depends on function call)
		serial.write(chk, function(err, results){
			// serial.close();
		}); //Checksum
	}
	/*Method 2: Send all at once*/
	// command += String.fromCharCode(0xFF); //ÿ Signature Byte Char
	// command += String.fromCharCode(0xFF); //ÿ Signature Byte Char
	// command += String.fromCharCode(motorID); // ID Byte Char
	// command += String.fromCharCode(length); //packet length
	// command += String.fromCharCode(instruction); //instruction byte
	// command += String.fromCharCode(register); //first parameter will always be the register address
	// command += String.fromCharCode(lowbyte); //value/lowbyte, depending on the function call
	// checksum = parseInt(motorID) + parseInt(length) + parseInt(instruction) + parseInt(register) + parseInt(lowbyte); //Assumes command is not PING, which uses neither lowbyte nor highbyte
	// if(highbyte != 0xFFFF){
	// 	command += String.fromCharCode(highbyte); //highbyte
	// 	checksum += parseInt(highbyte);
	// }
	// command += String.fromCharCode(~checksum & 0xFF); //Invert bits with Not bit operator and shave off high bytes, leaving only the lowest byte to determine checksum length
	// command += "-"; //For use in testing with Arduino Feedback
	// /*Send control packet and prep for reuse*/
	// serial.write(command, function() {});
	// console.log(">>Sent Control Signal: " + command); //For Debugging
	// command = ""; //clear command string for reuse
}