function speedConverter (speedInput){ //speedInput expected to be a number between 0 - 117.07 rpm
	/*Includes*/

	/*Globals*/
	
	//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
	var remainders = [];
	var hexed = false;
	var i = 1;

	/*Functions*/
	function highNum (mynumber){ //Converts 10-15 to their hexadecimal digit counterparts
		if(mynumber == 15){
			return "F";
		}
		else if(mynumber == 14){
			return "E";
		}
		else if(mynumber == 13){
			return "D";
		}
		else if(mynumber == 12){
			return "C";
		}
		else if(mynumber == 11){
			return "B";
		}
		else if(mynumber == 10){
			return "A";
		}
		else{
			return "[err]";
		}
	}

	/*Main*/
	var maxSpeed = (speedInput/117.07) * 1023; //with resolution divider = 1, 0 = 0 degrees, and 4095 = 360 degrees.
	var rounded = maxSpeed.toFixed(); //Rounds number to zero decimal places
	if(rounded > 1023){	// limits speed between 0.114 and 117.07 rpm
		rounded = 1023;
	}
	while(hexed == false){ //While hexadecimal number is incomplete:
		remainders[i] = rounded % 16; //remainders of this division are said to be the hexadecimal digits (see converting decimal to hexadecimal)
		rounded = (rounded - remainders[i])/16;
		if(rounded == 0){
			remainders.push('0x');
			hexed = true;
		}
		if(remainders[i] > 9){
			var temp = remainders[i];
			remainders[i] = highNum(temp);
		}
		i++;
	}

	//Yields the digits of the hexadecimal number corresponding to the Dynamixel Speed number map (0.114 rpm increments).
	var end = remainders.reverse().join().replace(/,/g, '');
	var motorSpeed_Hex = parseInt(end);
	
	//For Debugging...
	// console.log("Dynamixel Hexadecimal Signal: " + end); //Converting the hexadecimal number to decimal yields the number of Dynamixel degree increments to yield your desired degree.
	// console.log("Decimal Value: " + parseInt(end));
	// console.log("<motorSpeed Hex: " + end + " motorSpeed: " + motorSpeed_Hex + ">"); //motorSpeed Hex For Debugging

	return end; //returns the hexadecimal value as a string. To convert to numerical value, use parseInt() (see javascript reference)
}

module.exports = speedConverter;