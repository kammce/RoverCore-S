'use strict';
var i2c_bus = require('i2c-bus');
var PWMDriver = require('./PWMDriver')
var i2c = i2c_bus.open(2, function (err) { 
			if (err) {throw err;}
   			console.log("Opened PWM");
    		resolve(freq);
   			});

var PWM = new PWMDriver(0x50, 100, i2c);
//PWM.setPWM(2, 0, 0, 4095);
PWM.setDUTY(2, 0, 0);
setTimeout(function(){PWM.setDUTY(2, 1, 10)}, 20);
setTimeout(function(){PWM.setDUTY(2, 2, 20)}, 40);
setTimeout(function(){PWM.setDUTY(2, 3, 30)}, 60);
setTimeout(function(){PWM.setDUTY(2, 4, 40)}, 80);
setTimeout(function(){PWM.setDUTY(2, 5, 50)}, 100);
setTimeout(function(){PWM.setDUTY(2, 6, 60)}, 120);
setTimeout(function(){PWM.setDUTY(2, 7, 70)}, 140);
setTimeout(function(){PWM.setDUTY(2, 8, 80)}, 160);
setTimeout(function(){PWM.setDUTY(2, 9, 90)}, 180);
setTimeout(function(){PWM.setDUTY(2, 10, 100)}, 200);