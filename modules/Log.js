"use strict";
/* Code is based off of http://seanmonstar.com/post/56448644049/consolelog-all-the-things. Retreived October 11th, 2015 */

// var log = function hijacked_log(level) {
//   if (arguments.length > 1 && level in this) {
//     console.log.apply(this, arguments);
//   } else {
//     var args = Array.prototype.slice.call(arguments);
//     args.unshift(`[${Date().slice(0,-15)}][LOBE-NAME] :: `);
//     console.log.apply(this, args);
//   }
// }

var colors = require('colors');

class Log {
	constructor(module_name, output_color) {
		this.module = module_name;
		this.color = output_color;
	}
	log(level) {
		if (arguments.length > 1 && level in this) {
			console.log.apply(this, arguments);
		} else {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(`[${Date().slice(0,-15)}][${this.module}] :: `);
			console.log.apply(this, args);
		}
	}
}

module.exports = Log;