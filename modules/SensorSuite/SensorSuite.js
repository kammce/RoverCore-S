"use strict";

var Neuron = require('../Neuron');

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
    }
    react(input) {
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

module.exports = SensorSuite;
