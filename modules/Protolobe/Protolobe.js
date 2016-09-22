"use strict";

var Neuron = require('../Neuron');

class ProtoLobe extends Neuron
{
    constructor(util)
    {
        super(util);
        this.name = util.name;
        this.feedback = util.feedback;
        this.log = util.log;
        this.idle_time = util.idle_timeout;
        this.i2c = util.i2c;
        this.model = util.model;
        // =====================================
        // Construct Class After This Points
        // =====================================
    }
    react(input)
    {
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
        return true;
    }
    halt()
    {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
        return true;
    }
    resume()
    {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
        return true;
    }
    idle()
    {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
        return true;
    }
}

module.exports = ProtoLobe;