"use strict";
//smxxvxxaxxe
var Neuron = require('../Neuron');

class DriveSystem extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model, port) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        this.port = port;
        this.speed = 0;
        this.angle = 90;
        this.mode = 'c';
        this.interval = setInterval(this.sendState(), 100);
        // Construct Class here
    }
    react(input) {
        this.speed = input.speed;
        this.angle = input.angle;
        this.mode = input.mode;
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        clearInterval(this.interval);
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.interval = setInterval(this.sendState(), 100);
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
    }
    sendState(){
        port.write('sm' + this.mode + 'v' + this.speed + 'a' + this.angle + 'e');
    }
}

module.exports = ProtoLobe;