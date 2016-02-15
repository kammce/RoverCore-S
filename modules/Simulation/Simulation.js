"use strict";

var Neuron = require('../Neuron');

class Simulation extends Neuron {
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
        this.log.output(`SIM REACTING ${this.name}: `, input);
        this.feedback(this.name ,`SIM REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`SIM HALTING ${this.name}`);
        this.feedback(this.name ,`SIM HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`SIM RESUMING ${this.name}`);
        this.feedback(this.name ,`SIM RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`SIM IDLING ${this.name}`);
        this.feedback(this.name ,`SIM IDLING ${this.name}`);
    }
}

module.exports = Simulation;