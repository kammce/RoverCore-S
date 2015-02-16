/*Includes*/
var motorAngle = require("./motorAngle.js"); // The "./" tells node's "require()" to look in the directory of this file
var chkSum_W = require("./writeCheckSum.js");
// var hexify = require("./dec2hex.js"); //For Debugging
var motorSpeed = require("./motorSpeed.js");

/*Main*/
function anglePosition(value, motorID, ctrlTblAddress){
	var temp;
	var high;
	var low;
	var output = [];
	var CHECK_SUM = 0;

	// For Debugging
	var motorTag = ["ALL", "BASE", "LEFT SHOULDER", "RIGHT SHOULDER", "ELBOW", "WRIST"];
	var ctrlTblTag = ["Speed", "Position", "CCW Limit", "CW Limit"];
	if(ctrlTblAddress == 0x20){ //If the packet is intended for a change in the motor speed
		temp = motorSpeed(value);
	}
	else if(ctrlTblAddress == 0x1E){ //If the packet is intended for a change in the motor angle position
		temp = motorAngle(value);
	}
	else if(ctrlTblAddress == 0x08 || ctrlTblAddress == 0x06){ //If packet is intended to change max/min (ccw/cw) angle limits
		temp = motorAngle(value);
	}
	temp = parseInt(temp);

	/*Packet Formatter*/
	if(temp > 255){ //Any number greater than 255 will have a non-zero high byte to send (255 = 0x00FF, 256 = 0x0100)
		high = temp >> 8; //Bitshift Right: Gets rid of lower b)te (e.g. the lower 2 hex digits0, leaving only the higher byte
		low = temp & 0x00FF;
	}
	else{
		high = 0x00;
		low = temp & 0xFF;
	}
	CHECK_SUM = chkSum_W(motorID, 0x05, 0x03, ctrlTblAddress, low, high); //standard pos length = 0x05, writeCommand = 0x03
	// Output each individual byte (will come up as ASCII/Unicode chars)
	output.push(String.fromCharCode(0xFF), String.fromCharCode(0xFF), String.fromCharCode(motorID), String.fromCharCode(0x05), String.fromCharCode(0x03), String.fromCharCode(ctrlTblAddress), String.fromCharCode(low), String.fromCharCode(high), String.fromCharCode(CHECK_SUM));
	
	return output;
}

module.exports = anglePosition;