"use strict";
/*FOR TESTING PURPOSES*/
class PWMDriver {  // Dummy class resembling an instance of object PWM_Driver from Matt's i2c to pwm library
    constructor(address, frequency, i2c, log){
        this.setDUTY = function (pin, duty){    // controls linear actuators

        };
        this.setMICRO = function (pin, micro){  // controls servos

        };
    }
}
/***END FOR TESTING PURPOSES***/

module.exports = PWMDriver;