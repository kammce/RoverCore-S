"use strict";

var Neuron = require("../Neuron");

class RandomSineWave extends Neuron
{
	constructor(util)
	{
		// =====================================
		// Bootstrapping Section (DO NOT CHANGE)
		// =====================================
		//// Calls parent class constructor
		super(util);
		this.log.setColor("grey");
		this.idle_timeout = 2000;
		// =====================================
		// Construct Class After This Points
		// =====================================
		var time = 0;
		var sample_rate = 250;
		var amp = 10;
		var noise_amp = 5;
		var freq_multiplier = 50;
		var next_value = 0;

		this.model.registerMemory("Random");
		setInterval(() =>
		{
			//// generate sinewave signal
			next_value = amp*Math.sin(time);
			//// injecting noise
			next_value += (Math.random() * noise_amp*2 + 1) - noise_amp;
			time += Math.PI/freq_multiplier;
			//// set model random value
			this.model.set("Random", next_value);
		}, sample_rate);
	}
}

module.exports = RandomSineWave;