function decimal2hexadecimal(input){
	var hexed = false;
	var remainders = [];
	var i = 1

	function highNum (mynumber){
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

	while(hexed == false){ //While hexadecimal number is incomplete:
		remainders[i] = input % 16; //remainders of this division are said to be the hexadecimal digits (see converting decimal to hexadecimal)
		input = (input - remainders[i])/16;
		if(input == 0){
			remainders.push('0x');
			hexed = true;
		}
		if(remainders[i] > 9){
			var temp = remainders[i];
			remainders[i] = highNum(temp);
		}
		i++;
	}
	var end = remainders.reverse().join().replace(/,/g, '');
	var parsed = parseInt(end);
	var AND = parsed & 0x00FF;
	var NOT = ~parsed;

	return end;
}

module.exports = decimal2hexadecimal;