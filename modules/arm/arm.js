"use strict";

var Skeleton = require("../skeleton.js");
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm(model_ref) {
	this.model = model_ref;
}

Arm.prototype.read = function(data) {
	console.log("Arm Read Gravity: "+this.model.gravity);
};

module.exports = exports = Arm;