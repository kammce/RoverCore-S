"use strict";

var Neuron = require('../Neuron');

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