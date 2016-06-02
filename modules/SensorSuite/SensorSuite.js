
"use strict";

var Neuron = require('../Neuron');
var mpu9250 = require('./MPU9250.js');

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
        //mpu9250 class initialization

        //When only using one chip, comment out all lines related to "mpu2"
        this.mpu = new mpu9250(0x68, this.i2c, this.log);
        //this.mpu2 = new mpu9250(0x69, this.i2c, this.log);
        var parent = this;
        parent.mpu.wakeUp();
        //parent.mpu2.wakeUp();
        parent.model.registerMemory('MPU');
        //parent.model.registerMemory('MPU2');
        var update = setInterval(function() {
            parent.mpu.readData();
            parent.updateModel();
            //parent.mpu2.readData();
            //parent.updateModel2();
            // console log for debugging purposes
            // parent.log.output("\nChip1:\n",parent.model.get('MPU'));
            // parent.log.output("\nChip2:\n",parent.model.get('MPU'));
        }, 10);
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
            roll: mpu.inputs[27],
            pitch: mpu.inputs[28],
            temperature: mpu.inputs[29],
            heading: mpu.inputs[30]
        });
    }
    updateModel2() {
        var mpu = this.mpu2;
        this.model.set('MPU2', {
            xAngle: mpu.inputs[27],
            yAngle: mpu.inputs[28],
            temperature: mpu.inputs[29]
            // compass: mpu.inputs[30]
        });
    }
}

module.exports = SensorSuite;
