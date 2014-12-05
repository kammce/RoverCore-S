"use strict";

var Skeleton = require("../skeleton.js");
Tracker.prototype = new Skeleton("Tracker");
Tracker.prototype.constructor = Tracker;

function Tracker(model_ref) {
	this.model = model_ref;
}
Tracker.prototype.handle = function(data) {
	console.log("Tracker Recieved ", data);
};
Tracker.prototype.resume = function() {};
Tracker.prototype.halt = function() {};

module.exports = exports = Tracker;