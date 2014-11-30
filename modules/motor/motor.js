"use strict";

var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref) {
	this.model = model_ref;
}
Motor.prototype.read = function() {
	console.log("Motor Read Gravity: "+this.model.gravity);
};

module.exports = exports = Motor;