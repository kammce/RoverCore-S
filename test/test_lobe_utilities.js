"use strict";

var feedback_generator = function(lobe_name)
{
	var f = function()
	{
		var output = "";

		for (var argument of arguments)
		{
			// console.log(argument, JSON.stringify(argument));
			if(typeof argument === "object")
			{
				output += JSON.stringify(argument)+"\n";
			}
			else
			{
				output += argument+"\n";
			}
		}
		console.log("FEEDBACK: ",
		{
			target: lobe_name,
			message: output
		});
	};
	return f;
};

var name = "LOBE_UNDER_TEST";

var LOG = require("Log");
var MODEL = require("Model");

var log = new LOG(name, "white", 0);
var model = new MODEL(feedback_generator("model"));

var lobe_utitilites = {
	feedback: feedback_generator("LOBE_UNDER_TEST"),
	extended: {},
	upcall() {},
	name,
	model,
	log
};

module.exports = lobe_utitilites;