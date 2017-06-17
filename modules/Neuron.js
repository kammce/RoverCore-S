"use strict";

const NO_ACTION = "NO-ACTION";
const UNDEF = "UNDEF";

class Neuron
{
	constructor(util)
	{
		if( typeof util.name !== "string" ||
			typeof util.feedback !== "function" ||
			typeof util.log !== "function" )
		{
			return false;
		}
		this.name = util.name;
		this.feedback = util.feedback;
		this.log = util.log;
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