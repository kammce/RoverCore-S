"use strict";

var Neuron = require('../Neuron');

class RandomSineWave extends Neuron
{
	constructor(util)
	{
		super(util);
		this.name = util.name;
		this.feedback = util.feedback;
		this.log = util.log;
		this.idle_time = util.idle_timeout;
		this.model = util.model;
        // =====================================
        // Construct Class After This Points
        // =====================================
		var time = 0;
		var sample_rate = 250;
		var amp = 10;
		var noise_amp = 5;
		var freq_multiplier = 50;
		var next_value = 0;

		this.model.registerMemory("random");
		setInterval(() =>
		{
			//// generate sinewave signal
			next_value = amp*Math.sin(time);
			//// injecting noise
			next_value += (Math.random() * noise_amp*2 + 1) - noise_amp;
			time += Math.PI/freq_multiplier;
			//// set model random value
			this.model.set("random", next_value);
		}, sample_rate);
	}
	react()     { return true; }
	halt()      { return true; }
	resume()    { return true; }
	idle()      { return true; }
}

module.exports = RandomSineWave;