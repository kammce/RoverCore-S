"use strict";

function Skeleton(module_name) {
	if(typeof module_name == "undefined") {
		module_name = "unnamed-module";
	}
	//model: model_ref;
	this.module = module_name;
	this.is_halted = false;
	this.handle = undefined;
	this._handler = function(data) {
		if(this.is_halted) { return; }
		if(typeof this.handle == 'undefined') {
			console.log("Empty "+module+" handler: ", data);
		} else {
			this.handler(data);
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
	this.resume = function() {
		console.log("Resuming "+this.module);
		this.is_halted = false;
	}
}

module.exports = exports = Skeleton;