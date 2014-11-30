"use strict";

var Skeleton = require("../skeleton.js");
Tracker.prototype = new Skeleton("Tracker");
Tracker.prototype.constructor = Tracker;

function Tracker(model_ref) {
	this.model = model_ref;
}
Tracker.prototype.read = function(data) {
	console.log("Tracker Read Gravity: "+this.model.gravity);
};
module.exports = exports = Tracker;