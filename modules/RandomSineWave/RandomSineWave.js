"use strict";

var Neuron = require('../Neuron');

class RandomSineWave extends Neuron
{
	constructor(util)
	{
		// =====================================
		// Bootstrapping Section (DO NOT CHANGE)
		// =====================================
		//// Calls parent class constructor
		super(util);
		////Assigns class's name
		this.name = util.name;
		/**
		 * Feedback mechanism for sending information back to mission control.
		 * Usage:
		 *		this.feedback(msg_to_output, ...);
		 * 		this.feedback("HELLO WORLD", { foo: "bar" });
		 */
		this.feedback = util.feedback;
		/**
		 * Abstraction library for printing to standard out in color as well
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.log.output(msg_to_output, ...);
		 *		this.log.output("HELLO WORLD", { foo: "bar" });
		 */
		this.log = util.log;
		this.log.setColor("grey");
		/**
		 * This variable specifies the amount of time between react() calls before the
		 * idle() routine is called and the module state is moved to IDLING
		 */
		this.idle_timeout = 2000;
		/**
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.model.registerMemory("Proto");
		 *		this.model.set("Proto", {
		 *		    proto: 555
		 *		});
		 *		var proto = this.model.get("Proto");
		 */
		this.model = util.model;
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
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

	react()     { return true; }
	halt()      { return true; }
	resume()    { return true; }
	idle()      { return true; }
}

module.exports = RandomSineWave;