"use strict";

function Skeleton(module_name) {
	if(typeof module_name == "undefined") {
		module_name = "unnamed-module";
	}
	//model: model_ref;
	this.module = module_name;
	this.is_halted = false;
	this.handle = undefined;
	this._handle = function(data, feedback) {
		if(this.is_halted) { return; }
		if(typeof this.handle == 'undefined') {
			console.log("Empty "+module+" handle: ", data);
		} else {
			return this.handle(data, feedback);
		}
	};
	this.halt = undefined;
	this._halt = function() {
		console.log("Halting "+this.module);
		//// Stop acquiring data... not sure if this is a good idea though
		if(typeof this.halt == 'function') {
			this.halt();
		}
		this.is_halted = true;
	};
	this.resume = undefined;
	this._resume = function() {
		console.log("Resuming "+this.module);
		//// Stop acquiring data... not sure if this is a good idea though
		if(typeof this.resume == 'function') {
			this.resume();
		}
		this.is_halted = false;
	}
}

module.exports = exports = Skeleton;