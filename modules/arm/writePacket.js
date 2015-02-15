/*Includes*/
var motorAngle = require("./motorAngle.js"); // The "./" tells node's "require()" to look in the directory of this file
var chkSum_W = require("./writeCheckSum.js");
var hexify = require("./dec2hex.js"); //For Debugging
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
	output.push(0xFF, 0xFF, motorID, 0x05, 0x03, ctrlTblAddress, low, high, CHECK_SUM);
	var CHECK_SUM_Hex = hexify(CHECK_SUM);

	//For Debugging
	// console.log("motorAngle: " + temp);
	// console.log("Base: " + output);
	// if(motorID == 0xFE && ctrlTblAddress == 0x20){ //Speed Broadcast (i.e. set speed for all motors)
	// 	console.log(motorTag[0] + " Motors " + ctrlTblTag[0] + ":"); //Broadcast output
	// }
	// else if(ctrlTblAddress == 0x08){
	// 	console.log(motorTag[motorID + 1] + " Motor " + ctrlTblTag[2] + ":");
	// }
	// else if(ctrlTblAddress == 0x06){
	// 	console.log(motorTag[motorID + 1] + " Motor " + ctrlTblTag[3] + ":");
	// }
	// else{
	// 	console.log(motorTag[motorID + 1] + " Motor " + ctrlTblTag[1] + ":");
	// }
	//For Debugging
	//console.log("	<CHECK_SUM: " + CHECK_SUM + " CHECK_SUM Hex: " + CHECK_SUM_Hex + ">");
	
	return output;
}

module.exports = anglePosition;