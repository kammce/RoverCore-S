
"use strict";

var Neuron = require('../Neuron');
var mpu6050 = require('./MPU6050.js');

class SensorSuite extends Neuron {
    constructor(util) {
        super(util);
        this.name = util.name;
        this.feedback = util.feedback;
        this.log = util.log;
        this.idle_time = util.idle_timeout;
        this.i2c = util.i2c;
        this.model = util.model;
        // Construct Class here
        //mpu6050 class initialization
        this.mpu = new mpu6050(0x68, this.i2c, this.log);
//        this.mpu2 = new mpu6050(0x69, this.i2c, this.log);
        this.mpu.wakeUp();
//        this.mpu2.wakeUp();
        var parent = this;
        parent.model.registerMemory('MPU');
//        parent.model.registerMemory('MPU2');
        this.model.registerMemory('MPU');
//        model.registerMemory('MPU2');
        var update = setInterval(function() {
            parent.mpu.readData();
            parent.updateModel();
//            parent.mpu2.readData();
//            parent.updateModel2();
            // console log for debugging purposes
            // console.log(parent.model.get('MPU'));
            // console.log("0x69: " + parent.model.get('MPU2'));
        }, 500);
    }
    react(input) {
        var name = input.name;

        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
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

    updateModel() {
        var mpu = this.mpu;
        this.model.set('MPU', {
            xAngle: mpu.inputs[27],
            yAngle: mpu.inputs[28],
            temperature: mpu.inputs[29],
            compass: mpu.inputs[30]
        });
    }
    updateModel2() {
        var mpu = this.mpu2;
        this.model.set('MPU2', {
            xAngle: mpu.inputs[27],
            yAngle: mpu.inputs[28],
            temperature: mpu.inputs[29],
            compass: mpu.inputs[30]
        });
    }
}

module.exports = SensorSuite;
