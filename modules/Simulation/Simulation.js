"use strict";

var Neuron = require('../Neuron');

class Simulation extends Neuron {
    constructor(util) {
        super(util);
        this.name = util.name;
        this.feedback = util.feedback;
        this.log = util.log;
        this.idle_time = util.idle_timeout;
        this.i2c = util.i2c;
        this.model = util.model;
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