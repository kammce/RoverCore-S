"use strict";
class Neuron {

	constructor(name, feedback, color_log, idle_timeout) {
		if( typeof name !== "string" || 
			typeof feedback !== "function" || 
			typeof color_log !== "function" ) {
			return false;		
		}
		this.name = name;	
		this.feedback = feedback;
		this.log = color_log;
		if (typeof idle_timeout === 'undefined') {
			this.idle_timeout = 1000;
		} else { this.idle_timeout = idle_timeout; }
		
		this.halt = undefined;
		this.resume = undefined;
		this.react = undefined;
		this.idle = undefined;
		this.state = "CONSTRUCTING";
	}
	
	_halt() {
		if(typeof this.halt === "undefined") {
			return "UNDEF";
		} else {
			// run resume function and store return value
			var was_halt_successful = this.halt();
			if(was_halt_successful) {
				this.state = "HALTED";
			}
			return was_halt_successful;
		}
	}
	_resume() {
		if(typeof this.resume === "undefined") {
			return "UNDEF";
		} else {
			// run resume function and store return value 
			var was_resume_successful = this.resume();
			if(was_resume_successful) {
				this.state = "RUNNING";
			}
			return was_resume_successful;
		}
	}
	_react(input) {
		if(typeof this.react === "undefined") {
			return "UNDEF";
		} else if(typeof input === "undefined" || input === null) {
			return "NO-ACTION";
		} else if(this.state === "HALTED") {
			console.log("testing");
			this.log(`${this.name} is ${this.state}`);
			this.feedback(`${this.name} is ${this.state}`);
			return "NO-ACTION";
		} else {
			console.log("testing2");
			return this.react(input);
		}
	}
	_idle() {
		if(typeof this.idle === "undefined") {
			return "UNDEF";
		} else {
			// run resume function and store return value 
			var was_idle_successful = this.idle();
			if(was_idle_successful) {
				this.state = "IDLING";
			}
			return was_idle_successful;
		}
	}
}

module.exports = Neuron;