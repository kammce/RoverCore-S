"use strict";

const EventEmitter = require("events");
const util = require("util");

function compileResponse(obj){
	var response = "q,";
	response += obj.new_movement.dboxPitch + ",";
	response += obj.new_movement.dc + ",";
	response += obj.new_movement.dboxRoll + ",";
	response += obj.new_movement.firgelli + ",";
	response += obj.new_movement.rotunda + ",";
	response += obj.new_movement.clawAngle + ",";
	response += obj.currentReading.rotunda + ",";
	response += obj.currentReading.dc + ",";
	response += obj.currentReading.firgelli + ",";
	response += obj.currentReading.dboxServos + ",";
	response += obj.currentReading.claw + "?";
	return response;
}
function emission(){
	EventEmitter.call(this);
}
util.inherits(emission, EventEmitter);	//so that emission inherits the properties/methods of "events", essentially becoming an event object

class SerialPort{	// mock serial port library
	constructor(path, options, openimmediately, callback){
		// this.openEvent = new Event("open", {"bubbles": false, "cancelable": false, "target": this});
		// this.dataEvent = new Event("data");
		this.emitter = new emission();
		this.path = path;
		this.options = options;
		this.openimmediately = openimmediately;
		this.callback = callback;
		this.returnbuffer = "";
		this.functions = {
			data: "",
			open: "",
			close: ""
		};
		this.new_movement = {
			rotunda: 0,
			dc: 0,
			firgelli: 0,
			clawMode: "r",
			clawAngle: 0,
			dboxPitch: 0,
			dboxRoll: 0,
			dboxTarget: 0,
			laser: 0
		};
		this.currentReading = {
			rotunda: 0,
			dc: 0,
			firgelli: 0,
			dboxServos: 0,
			claw: 0
		};
		this.timer = ""; // timeout object

		var parent = this;

		this.on = function(eventname, func){
			switch(eventname){
				case "open":{
					// parent.functions.open = func;
					parent.emitter.on("open", func);
					break;
				}
				case "data":{
					// parent.functions.data = func;
					parent.emitter.on("data", func);
					break;
				}
				default:{

				}
			}
		};

		this.write = function(data){ // function to parse the data from Arm Lobe to SAMD21
			var cmd = data.split(",");	// splits string into array of the different parameters
			var type = cmd[0];
			
			if(cmd.length < 2){
				console.log("Err: received short string");
				return;
			} else if(!cmd[cmd.length - 1].includes("?")) {
				console.log("Err: missing command terminator");
				return;
			} else {
				cmd[cmd.length - 1].replace("?", "");
			}

			// Parse the received command
			switch(type){
				case ">":{
					parent.new_movement.rotunda = cmd[1];
					parent.new_movement.dc = cmd[2];
					parent.new_movement.firgelli = cmd[3];
					parent.new_movement.clawMode = cmd[4];
					parent.new_movement.dboxPitch = cmd[5];
					parent.new_movement.dboxRoll = cmd[6];
					parent.new_movement.dboxTarget = cmd[7];
					parent.new_movement.laser = cmd[8];
					parent.new_movement.clawAngle = Math.floor(Math.random() * (180 - 0)) + 0; // randomNum * (max - min) + min

					parent.respond();
					break;
				}
				case "<":{
					// if(cmd[1] == "A"){
					// 	parent.functions.data(compileResponse(parent));
					// }
					break;
				}
				default:{
					console.log("Err: Unknown command type");
				}
			}
		};

		this.respond = function(){
			// parent.functions.data(compileResponse(parent));
			parent.emitter.emit("data", compileResponse(parent));
		};
	}
}

// class serialport{
// 	constructor(){
// 		this.SerialPort = "Nothing";
// 		console.log("SerialPort: " + this.SerialPort);
// 	}
// }

module.exports = SerialPort;