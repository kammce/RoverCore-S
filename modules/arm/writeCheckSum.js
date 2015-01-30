function writingCheckSum (ID, Length, Instruction, ControlTableAddress, LowByte, HighByte){ //based on andOperator.js
	// var high = 0;
	// var low = 0;
	var num;
	var temp = (ID + Length + Instruction + ControlTableAddress + LowByte + HighByte) & 0x00FF;
	num = (~temp) & 0x00FF;
	//For Debugging...
	//console.log("Num: " + num);
	return num;
}

module.exports = writingCheckSum;