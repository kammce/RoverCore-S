"use strict";

var Neuron = require('../Neuron');

class ProtoLobe extends Neuron {
    constructor(name, feedback, color_log, idle_timeout) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;   
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        // Construct Class here
    }
    react(input) {
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(`REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(`HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(`RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(`IDLING ${this.name}`);
    }
}

module.exports = ProtoLobe;