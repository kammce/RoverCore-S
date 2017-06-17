"use strict";

//High byte ---- [7:5] reserved [4] full on [3:0] first 4 bits of 4096.
//Low  byte ---- [7:0] last 8 bits of 4096.

//SM-BUS Signal Format
//Start condition (S) | slave address | R/~W | Acknowledgement from slave |
//Control register | Acknowledgement from slave | Data Byte | Acknowledgement from slave | stop condition(P)

//  bus.writeByte(addr, cmd, byte, cb)
//  addr - I2C device address
//  cmd -  command code
//  byte - data byte
//  cb -   completion callback

//	dev_addr      	 = 0x40;
//	SUBADR1       	 = 0x02;
//	SUBADR2       	 = 0x03;
//	SUBADR3			 = 0x04;
//	MODE1 			 = 0x00;
//	PRESCALE  		 = 0xFE;
//	PWM_DEV_LED0_ON_L 		 = 0x06;
//	PWM_DEV_LED0_ON_H 		 = 0x07;
//	PWM_DEV_LED0_OFF_L		 = 0x08;
//	PWM_DEV_LED0_OFF_H 		 = 0x09;
//	ALLLED_ON_L 	 = 0xFA;
//	ALLLED_ON_H 	 = 0xFB;
//	ALLLED_OFF_L 	 = 0xFC;
//	ALLLED_OFF_H 	 = 0xFD;

const PWM_DEV_LED0_ON_L = 0x06;
const PWM_DEV_LED0_ON_H = 0x07;
const PWM_DEV_LED0_OFF_L = 0x08;
const PWM_DEV_LED0_OFF_H = 0x09;
const PWM_DEV_MODE1 = 0x00;
const PWM_DEV_PRESCALE = 0xFE;

class PCA9685PWMDriver
{
	constructor(address, freq, i2c, log)
	{
		this.i2c = i2c;
		this.freq = freq;
		this.dev_addr = address;
		this.log = log;
		var prescale = Math.floor((((25000000 / 4096) / (freq * 0.9)) - 1) + 0.5);
		i2c.writeByteSync(address, PWM_DEV_MODE1, 0x00);
		var oldmode = i2c.readByteSync(address, PWM_DEV_MODE1);
		var newmode = parseInt((oldmode & 0x7F) | 0x10);
		i2c.writeByteSync(address, PWM_DEV_MODE1, newmode);
		i2c.writeByteSync(address, PWM_DEV_PRESCALE, prescale);
		i2c.writeByteSync(address, PWM_DEV_MODE1, oldmode);
		setTimeout(function()
			{
				i2c.writeByteSync(address, PWM_DEV_MODE1, (oldmode | 0xa1));
			},
			5,
			function(err)
			{
				if (err)
				{
					this.log.output("Error in PCA9685PWMDriver constructor setTimeout");
					this.log.output(err);
				}
			}
		);
	}
	isNumber(o)
	{
		if (typeof o === "number" || (typeof o === "object" && o.constructor === Number))
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	genByteH(input)
	{
		if (!this.isNumber(input))
		{
			this.log.output("Invalid Data Type in genByteH of setDUTY of PCA9685PWMDriver");
		}
		var MSB = input >> 8;
		if (input === 4096)
		{
			MSB = 16;
		}
		return MSB;
	}
	genByteL(input)
	{
		if (!this.isNumber(input))
		{
			this.log.output("Invalid Data Type in genByteL of setDUTYof PCA9685PWMDriver");
		}
		var LSB = input & 0x0FF;
		if (input === 4096)
		{
			LSB = 0;
		}
		return LSB;
	}
	setDUTY(pin, duty)
	{
		var i2c = this.i2c;
		var parent = this;
		var sendpwmRegOnL = function(num, on)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_ON_L + 4 * num, parent.genByteL(on), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOnL of setDuty of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		var sendpwmRegOnH = function(num, on)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_ON_H + (4 * num), parent.genByteH(on), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOnH of setDuty of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		var sendpwmRegOffL = function(num, off)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_OFF_L + (4 * num), parent.genByteL(off), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOffL of setDuty of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		var sendpwmRegOffH = function(num, off)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_OFF_H + (4 * num), parent.genByteH(off), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOffH of setDuty of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		if (this.isNumber(duty) && duty <= 100 && duty >= 0)
		{
			sendpwmRegOnL(pin, 0)
				.then(sendpwmRegOnH(pin, 0))
				.then(sendpwmRegOffL(pin, 4095 * (duty / 100)))
				.then(sendpwmRegOffH(pin, 4095 * (duty / 100)));
			return true;
		}
		else
		{
			return false;
		}
	}
	setMICRO(pin, micro)
	{
		var parent = this;
		var i2c = this.i2c;
		var freq = this.freq;
		var oneMicro = 0.000001 * (freq * 4096);
		var tick = Math.floor(micro * oneMicro);
		var sendpwmRegOnL = function(num, on)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_ON_L + 4 * num, parent.genByteL(on), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOnL of setMICRO of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		var sendpwmRegOnH = function(num, on)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_ON_H + (4 * num), parent.genByteH(on), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOnH of setMICRO of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		var sendpwmRegOffL = function(num, off)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_OFF_L + (4 * num), parent.genByteL(off), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOffL of setMICRO of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});

			});
		};
		var sendpwmRegOffH = function(num, off)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_OFF_H + (4 * num), parent.genByteH(off), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOffH of setMICRO of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		if (this.isNumber(micro) && tick > 1 && tick < 4096)
		{
			sendpwmRegOnL(pin, 0)
				.then(sendpwmRegOnH(pin, 0))
				.then(sendpwmRegOffL(pin, tick))
				.then(sendpwmRegOffH(pin, tick));
			return true;
		}
		else
		{
			return false;
		}
	}
	setPWM(pin, on, off)
	{
		var i2c = this.i2c;
		var parent = this;

		var sendpwmRegOnL = function(num, on)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_ON_L + 4 * num, parent.genByteL(on), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOnL of setPWM of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		var sendpwmRegOnH = function(num, on)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_ON_H + (4 * num), parent.genByteH(on), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOnH of setPWM of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});

		};
		var sendpwmRegOffL = function(num, off)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_OFF_L + (4 * num), parent.genByteL(off), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOffL of setPWM of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		var sendpwmRegOffH = function(num, off)
		{
			return new Promise(function(resolve)
			{
				i2c.writeByte(parent.dev_addr, PWM_DEV_LED0_OFF_H + (4 * num), parent.genByteH(off), function(err)
				{
					if (err)
					{
						parent.log.output("writeByte error in sendpwmRegOffH of setPWM of PCA9685PWMDriver");
						parent.log.output(err);
					}
					resolve(1);
				});
			});
		};
		if (this.isNumber(on) && this.isNumber(off) && on < 4096 && on >= 0 && off < 4096 && off >= 0)
		{
			sendpwmRegOnL(pin, on)
				.then(sendpwmRegOnH(pin, on))
				.then(sendpwmRegOffL(pin, off))
				.then(sendpwmRegOffH(pin, off));
			return true;
		}
		else
		{
			return false;
		}
	}
}
module.exports = PCA9685PWMDriver;
