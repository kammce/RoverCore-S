"use strict";

var Neuron = require('../Neuron');
// Will use class PWM_Driver(); Whether it will be required by my code or be global is TBD
/*  As of 1/29/16:
    class Arm will have its own class PWM_Driver(port,frequency) initialized here, with port = the i2c address of the adc device used to control the motors, and frequency = frequency of the signal that the pin will output

    setDuty(i2c_port, pwm_pin, duty) will be used to control the Linear Actuators since they use pwm duty cycles for control.
        parameters:
            i2c_port: the i2c address of the motor control adc in the i2c network
            pwm_pin: the pin of the motor control adc that the desired motor is connected to
            duty: the duty cycle percentage (0%-100%) that the pin should output (controls diff. things depending on context)
        note:
            This function will be used to perform two tasks:
                1.> LINEAR ACTUATOR SPEED CONTROL: used to connect to adc @ "i2c_port", and send the speed "duty" (an integer representing anywhere from 0% to 100%) to the linear actuator connected on pin "pwm_pin" on the adc.
                2.> LINEAR ACTUATOR DIRECTION: used to connect to adc @ "i2c_port", and send the direction "duty" (an integer representing either 0% or 100% for extend/retract, convention to be decided) to the linear actuator connected on pin "pwm_pin" on the adc

    setMICRO(Micro_seconds) will be used to control the Servos.
        parameters:
            Micro_seconds: the amount of micro seconds the signal will be high for; this directly correlates to the speed of the servo rotation. The motor position will need to be checked to keep track of when to stop the motor, then the motor will be stopped using this function
*/

class Arm extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c; // holds link to a Bus object returned by i2c-bus.open(); will use to grab data off of motor-reading adc
        this.model = model;

        // Construct Class here
        this.savedposition = {  // Used for an automated action
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0
        };
        this.position = {       // This variable stores feedback from the motors
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0
        };
        // this.isSafe = function(){};
        // this.moveServo = function(){};
        // this.moveActuator = function(){};
        // this.readadc = function(){};
        // this.claw = function(){};
        // this.switchTool = function(){};
        // this.tool = function(){};
    }
    react(input) {  //put arm control logic here
        

        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
    }
}

module.exports = Arm;