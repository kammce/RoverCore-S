"use strict";

var Neuron = require('../Neuron');
var mpu6050 = require('./MPU6050.js');

class SensorSuite extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        // Construct Class here
            //mpu6050 class initialization
        this.mpu = new mpu6050(this.i2c, this.log);
            this.mpu.wakeUp();
        var parent = this;
        setInterval(function() {
             parent.mpu.readData();
        }, 200) ;
    }
    react(input) {
        var mpu = this.mpu;
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
        // mpu.wakeUp();
        // var interval = setInterval(function() {
        //     mpu.readData();
        // }, 1500);
    }
    halt() {
        var mpu = this.mpu;
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
       // mpu.sleep();
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        var mpu = this.mpu;
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
       // mpu.sleep();
    }
    // groundTemp() {

    // }
    // humidity() {

    // }
}

module.exports = SensorSuite;
