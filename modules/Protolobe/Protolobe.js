"use strict";

var Neuron = require('../Neuron');

class ProtoLobe extends Neuron
{
	constructor(util)
	{
		// =====================================
		// Bootstrapping Section (DO NOT CHANGE)
		// =====================================
		//// Calls parent class constructor
		super(util);
		/**
		 * Assigns class's name
		 */
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
		console.log(this.log);
		this.log.setColor("red");
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
	}
	/* Abstraction library for printing to standard out in color as well
	 * as writing debug information to file periodically.
	 * Usage:
	 *    this.log.output(msg_to_output, ...);
	 *    this.log.output("HELLO WORLD", { foo: "bar" });
	 */
	react(input)
	{
		this.log.output(`REACTING ${this.name}: `, input);
		this.feedback(`REACTING ${this.name}: `, input);
		return true;
	}
	/* Abstraction library for printing to standard out in color as well
	 * as writing debug information to file periodically.
	 * Usage:
	 *    this.log.output(msg_to_output, ...);
	 *    this.log.output("HELLO WORLD", { foo: "bar" });
	 */
	halt()
	{
		this.log.output(`HALTING ${this.name}`);
		this.feedback(`HALTING ${this.name}`);
		return true;
	}
	/* Abstraction library for printing to standard out in color as well
	 * as writing debug information to file periodically.
	 * Usage:
	 *    this.log.output(msg_to_output, ...);
	 *    this.log.output("HELLO WORLD", { foo: "bar" });
	 */
	resume()
	{
		this.log.output(`RESUMING ${this.name}`);
		this.feedback(`RESUMING ${this.name}`);
		return true;
	}
	/* Abstraction library for printing to standard out in color as well
	 * as writing debug information to file periodically.
	 * Usage:
	 *    this.log.output(msg_to_output, ...);
	 *    this.log.output("HELLO WORLD", { foo: "bar" });
	 */
	idle()
	{
		this.log.output(`IDLING ${this.name}`);
		this.feedback(`IDLING ${this.name}`);
		return true;
	}
}

module.exports = ProtoLobe;