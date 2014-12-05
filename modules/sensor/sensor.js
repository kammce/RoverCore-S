"use strict";

var Skeleton = require("../skeleton.js");
Sensor.prototype = new Skeleton("Sensor");
Sensor.prototype.constructor = Sensor;

function Sensor(model_ref) {
	this.model = model_ref;
}
Sensor.prototype.update = function(data) {
	this.model.gravity += 5;
};
Sensor.prototype.resume = function() {};
Sensor.prototype.halt = function() {};

module.exports = exports = Sensor;