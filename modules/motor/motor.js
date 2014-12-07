"use strict";

var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref) {
	this.model = model_ref;
}
Motor.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
};
Motor.prototype.resume = function() {};
Motor.prototype.halt = function() {};

module.exports = exports = Motor;
