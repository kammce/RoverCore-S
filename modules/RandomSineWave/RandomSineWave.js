"use strict";

var Neuron = require('../Neuron');

class RandomSineWave extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        // Construct Class here
        var parent = this;
        var time = 0;
        var sample_rate = 250;
        var amp = 10;
        var noise_amp = 5;
        var freq_multiplier = 50;
        var next_value = 0;    

        this.model.registerMemory("random");
        setInterval(function() {
            next_value = amp*Math.sin(time); // generate sinewave signal
            next_value += (Math.random() * noise_amp*2 + 1) - noise_amp; // injecting noise
            time += Math.PI/freq_multiplier;

            parent.model.set("random", next_value); // set model random value
            //console.log(parent.model.get("random"));
        }, sample_rate);
    }
    react() {}
    halt() {}
    resume() {}
    idle() {}
}

module.exports = RandomSineWave;