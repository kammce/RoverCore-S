"use strict";

class i2c_lib {		// Dummy class resembling an instance of object Bus from the i2c-bus library
	constructor(){
		// Dummy variables used in the emulation of i2c device communication
		this.channel = 0;	// channel 0 of 8
		this.current_val = {	//emulates the values coming from the motor feedback
			"0":parseInt("0000000000110000", 2),
			"1":parseInt("0000000000110000", 2),
			"2":parseInt("0000000000110000", 2),
			"3":parseInt("0000000000110000", 2),
			"4":parseInt("0000000000110000", 2),
			"5":parseInt("0000000000110000", 2),
			"6":parseInt("0000000000110000", 2),
			"7":parseInt("0000000000110000", 2)
		}

		// Dummy functions
		this.readI2cBlockSync = function (addr, cmd, len, buf, callback){
			var registerNum = cmd;
			var err = null;
			var buffer = buf;

			/*Emulates the writing of bytes to the buffer*/
			for(var i = 0; i < len; i++){
				buf[i] = 0x0041 * i;
			}

			var bytesread = len;	// emulates len number of bytes (motor positions) that have been read
			callback(err, bytesread, buffer);
		};
		this.readWordSync = function(addr, cmd){
			return 0xFFF0; // emulates the output of the adc (i.e. positional values): x x x x  x x x x  x x x x  0 0 0 0
		};
		this.i2cWriteSync = function(addr, len, buffer){
			var length_written = len;
			switch(buffer){
				case parseInt("10001000", 2):
					this.channel = 0;
					break;
				case parseInt("11001000", 2):
					this.channel = 1;
					break;
				case parseInt("10011000", 2):
					this.channel = 2;
					break;
				case parseInt("11011000", 2):
					this.channel = 3;
					break;
				case parseInt("10101000", 2):
					this.channel = 4;
					break;
				case parseInt("11101000", 2):
					this.channel = 5;
					break;
				case parseInt("10111000", 2):
					this.channel = 6;
					break;
				case parseInt("11111000", 2):
					this.channel = 7;
					break;
				default:
					length_written = 0;
			}
			return length_written;	//returns # of bytes written
		};
		this.i2cReadSync = function(addr, len, buffer){
			if(len != buffer.length)
				return 0;
			switch(this.channel){
				case 0: 
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
				case 1:
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
				case 2:
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
				case 3:
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
				case 4:
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
				case 5:
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
				case 6:
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
				case 7:
					buffer[0] = parseInt("10001010", 2);
					buffer[1] = parseInt("11110000", 2);
					break;
			}
			return len;	//returns # of bytes written
		};
	}
}

module.exports = i2c_lib;