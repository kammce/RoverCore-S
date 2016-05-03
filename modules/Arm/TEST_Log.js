"use strict";

class Log{
	constructor(module_name, output_color){
		this.module_name = module_name;
		this.output_color = output_color;
		
		this.output = function(pretext, msg){
			console.log(pretext + msg);
		};
	}
}

module.exports = Log;