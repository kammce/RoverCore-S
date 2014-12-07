"use strict";

var Skeleton = require("../skeleton.js");
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm(model_ref) {
	this.model = model_ref;
}

Arm.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
};
Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};

module.exports = exports = Arm;