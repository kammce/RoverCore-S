"use strict";

var fs = require('fs');

function Logger(model_ref) {
	this.model = model_ref;
	this.logging = false;
	this.log_date = "";
}
Logger.prototype.log = function(data) {};

module.exports = exports = Logger;