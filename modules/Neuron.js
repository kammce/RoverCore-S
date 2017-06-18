"use strict";

const NO_ACTION = "NO-ACTION";
const UNDEF = "UNDEF";

class Neuron
{
	constructor(util)
	{
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
		 * A method for making up calls to cortex to control the system
		 */
		this.upcall = util.upcall;

		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;

		this.controller = "";
		this.idle_timeout = 1000;
		this.state = "RUNNING";
	}
	_halt()
	{
		var status = UNDEF;
		if(this.halt)
		{
			// run resume function and store return value
			var was_halt_successful = this.halt();
			if(was_halt_successful)
			{
				this.state = "HALTED";
			}
			status = was_halt_successful;
		}
		return status;
	}
	_resume()
	{
		var status = UNDEF;
		if(this.resume)
		{
			// run resume function and store return value
			var was_resume_successful = this.resume();
			if(was_resume_successful)
			{
				this.state = "RUNNING";
			}
			status = was_resume_successful;
		}
		return status;
	}
	_react(input)
	{
		var status = UNDEF;
		if(this.state === "HALTED")
		{
			this.log.output(`${this.name} is ${this.state}`);
			this.feedback(`${this.name} is ${this.state}`);
			status = NO_ACTION;
		}
		else if(this.react)
		{
			this.state = "RUNNING";
			status = this.react(input);
		}
		return status;
	}
	_idle()
	{
		var status = UNDEF;
		if(this.idle)
		{
			// run resume function and store return value
			if(this.state !== "IDLING")
			{
				var was_idle_successful = this.idle();
				this.state = "IDLING";
				status = was_idle_successful;
			}
			else
			{
				status = false;
			}
		}
		return status;
	}
}

Neuron.prototype.halt = null;
Neuron.prototype.resume = null;
Neuron.prototype.react = null;
Neuron.prototype.idle = null;

module.exports = Neuron;