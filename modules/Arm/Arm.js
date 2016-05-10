"use strict";

// var SerialPort = require('serialport').SerialPort;  //Library for serial link; using serial-port
var SerialPort = require('../TEST_serialport.js');  // For Unit Testing
var Neuron = require('../Neuron');

class Arm extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c; // holds link to a Bus object returned by i2c-bus.open(); will use to grab data off of motor-reading adc
        this.model = model;
        this.tool = 0; //tool currently being held
        const maxAttempts = 50;    //Max attempts to try to extablish serialport connection
        const update_time = 500;    //Interval time for the lobe to broadcast its present state to console
        const setup_time = 2500;    //Time for things to "setup"/initialize before beginning to broadcast its present state to console
        const SAMD21addr = "/dev/ttyACM0";
        var attempts = 0;
        var parent = this;

        // Angular Bounds
        var high = {
            "wrist": 180,
            "elbow": 76,
            "base": 180,
            "shoulder": 58,
            "claw": 60      //TBD
        };
        var low = {
            "wrist": 0,
            "elbow": 0,
            "base": 0,
            "shoulder": 0,
            "claw": 0       //TBD
        };

        // Arm instantaneous state records
        this.laser = 0; //defaults to off
        this.target = { // This variable stores the current target position of the arm
            "base": 0,
            "shoulder": 0,
            "elbow": 0,
            "wrist": 0,
            "roll": 0,
            "rolldir": 0,
            "claw": 0
        };
        this.current = {
            "base": 0.00,
            "shoulder": 0.00,
            "elbow": 0.00,
            "wrist": 0.00,
            "claw": 0.00
        };
        this.position = { // This variable stores feedback from the motors
            "base": 90,
            "shoulder": 29,
            "elbow": 38,
            "wrist": 90,    //pitch
            "roll": 180,    //roll angle
            "rolldir": 0,
            "claw": 0
        };
        this.current_limit = {  // Current limit is expected to be 0.00-100.00% from interface, and 0-1000 to SAMD21
            "base": 100.00,
            "shoulder": 100.00,
            "elbow": 100.00,
            "wrist": 100.00,
            "claw": 100.00
        }

        // Register model memory
        this.model.registerMemory("Arm_State");  //current state of Arm; current draw, positions, target positions

        // Create Serialport object
        this.serial = new SerialPort(SAMD21addr, {  // SAMD21 serial port address
            baudrate: 9600
        }, false);  //false prevents serialport from openning automatically

        // Create continuous-interval state reporting function (logs current state to console,etc.)
        this.reportState = function(){
            if(parent.serial.isOpen()){
                if(parent.position !== parent.target){
                    parent.log.output(parent.position);
                    parent.log.output(parent.target);
                    parent.log.output(parent.current);
                }
            }
        };

        // Creat Serialport Connection Establishment Error Handler
        var openSerial = (err) => {     // equiv. to "var openSerial = function(err){}", but keeps scope in Arm lobe (only on JS ECMA 6)
            if(attempts >= maxAttempts){
                return;
            } else if (err) {
                this.log.output(`REACTING ${this.name} \n `, "Failed to open " + SAMD21addr + " (attempt " + attempts + ")"); //log to console
                this.feedback("Failed to open " + SAMD21addr + " (attempt " + attempts + ")"); //log to interface
                attempts++;     //increment current attempt
                setTimeout(() => {  //Try openning serialport again
                    this.log.output(`REACTING ${this.name} \n `, "Retry openning " + SAMD21addr + " (attempt " + attempts + ")"); //log to console
                    this.feedback("Retry openning " + SAMD21addr + " (attempt " + attempts + ")"); //log to interface
                    this.port.open(openSerial);
                }, 2000);
                return;
            } else {
                setTimeout(() => {
                    this.reportInterval = setInterval(this.reportState, update_time);
                }, setup_time);
            }
        };

        // Startup the connection
        this.serial.open(openSerial);

        // Parse any incoming data from SAMD21
        this.serial.on("data", function(message){
            // if incoming message is incorrectly formatted
            if(message[0] !== "q" || !(message.includes(",")) || message[message.length - 1] !== "?"){
                parent.log.output(`REACTING ${parent.name} \n `, "Invalid SAMD21 message string");
                return;
            }

            // remove "?" ending symbol and "q," start symbol
            message = message.substring(2, message.length - 1);
            var data = message.split(",");
            // console.log(data);

            // if incoming message did not include enough data
            if(data.length !== 11){
                parent.log.output(`REACTING ${parent.name} \n `, "Incomplete SAMD21 data");
                return;
            }
            
            // record positions (follows order rotunda->dc->firgelli->wrist->claw)
            parent.position.base = parseInt(data[0]);
            parent.position.shoulder = parseInt(data[1]);
            parent.position.elbow = parseInt(data[2]);
            parent.position.wrist = parseInt(data[3]);  //pitch
            parent.position.roll = parseInt(data[4]);   //roll angle
            parent.position.claw = parseInt(data[5]);

            // record current draw
            parent.current.base = parseInt(data[6]);      //base rotunda current
            parent.current.shoulder = parseInt(data[7]);  //shoulder DC motor current
            parent.current.elbow = parseInt(data[8]);     //elbow firgelli current
            parent.current.wrist = parseInt(data[9]);     //wrist servos' current
            parent.current.claw = parseInt(data[10]);      //claw servo current

            // place data into the model
            var ArmPresentState = {
                position: parent.position,
                current: parent.current,
                current_limit: parent.current_limit,
                target: parent.target
            };
            parent.model.set("Arm_State", ArmPresentState);
        });

        // Define protocol when communication error occurs
        this.serial.on("err", function (err){
            parent.log.output(`REACTING ${parent.name} \n `, "Communication error with " + SAMD21addr + " occurred"); //log to console
            parent.feedback("Communication error with " + SAMD21addr + " occurred"); //log to interface
        });

        // If any one of the angles is out-of-bounds, set the angle to the correct limit;
        this.rectify = function(goal) {
            if (goal.wrist > high.wrist || goal.wrist < low.wrist) {
                // Set angle to correct limit
                if(goal.wrist > high.wrist){
                    goal.wrist = high.wrist;
                } else {
                    goal.wrist = low.wrist;
                }
            }
            if (goal.shoulder > high.shoulder || goal.shoulder < low.shoulder) {
                // Set angle to correct limit
                if(goal.shoulder > high.shoulder){
                    goal.shoulder = high.shoulder;
                } else {
                    goal.shoulder = low.shoulder;
                }
            }
            if (goal.elbow > high.elbow || goal.elbow < low.elbow) {
                // Set angle to correct limit
                if(goal.elbow > high.elbow){
                    goal.elbow = high.elbow;
                } else {
                    goal.elbow = low.elbow;
                }
            }
            if (goal.base > high.base || goal.base < low.base) {
                // Set angle to correct limit
                if(goal.base > high.base){
                    goal.base = high.base;
                } else {
                    goal.base = low.base;
                }
            }
            if (goal.claw > high.claw || goal.claw < low.claw) {
                // Set angle to correct limit
                if(goal.claw > high.claw){
                    goal.claw = high.claw;
                } else {
                    goal.claw = low.claw;
                }
            }
        };
        this.readSAM = function(){  //manually ask for all data from the SAMD21 //Is this really needed, since SAMD sends data automatically?
            // Query SAMD21 control software for All data
            if(parent.serial.isOpen()){
                parent.serial.write("<,A?");
            } else {
                parent.log.output(`REACTING ${parent.name} \n `, "Communication Error with " + SAMD21addr);
                parent.feedback("Communication Error with " + SAMD21addr);
            }
        };
        this.turnLaser = function(state){
            var cmdstr = "C";

            // update the Arm's laser state
            parent.laser = state;

            // format command string
            cmdstr += "," + parent.target.base;      //base rotunda
            cmdstr += "," + parent.target.shoulder;  //shoulder DC motor
            cmdstr += "," + parent.target.elbow;     //elbow firgelli
            cmdstr += "," + parent.target.wrist;     //wrist pitch
            cmdstr += "," + parent.target.rolldir;
            cmdstr += "," + parent.target.roll;
            cmdstr += "," + parent.target.claw;
            cmdstr += "," + state;
            cmdstr += "?";
            
            // send command to SAMD21
            if(parent.serial.isOpen()){
                parent.serial.write(cmdstr);
            } else {
                parent.log.output(`REACTING ${parent.name} \n `, "Communication Error with " + SAMD21addr);
                parent.feedback("Communication Error with " + SAMD21addr);
            }
        };
        this.moveArm = function(goal){
            var cmdstr = "C";

            // update the Arm's target position
            parent.target.wrist = goal.wrist;
            parent.target.shoulder = goal.shoulder;
            parent.target.elbow = goal.elbow;
            parent.target.base = goal.base;
            //keep old claw and roll positions as the target; moveArm doesn't move the claw

            // format command string
            cmdstr += "," + goal.base;      //base rotunda
            cmdstr += "," + goal.shoulder;  //shoulder DC motor
            cmdstr += "," + goal.elbow;     //elbow firgelli
            cmdstr += "," + goal.wrist;     //wrist pitch
            cmdstr += "," + parent.target.rolldir;
            cmdstr += "," + parent.target.roll;
            cmdstr += "," + parent.target.claw;
            cmdstr += "," + parent.laser;
            cmdstr += "?";
            
            // send command to SAMD21
            if(parent.serial.isOpen()){
                parent.serial.write(cmdstr);
            } else {
                parent.log.output(`REACTING ${parent.name} \n `, "Communication Error with " + SAMD21addr);
                parent.feedback("Communication Error with " + SAMD21addr);
            }
        };
        this.moveClaw = function(goal){
            var cmdstr = "C";

            parent.target.claw = goal.grab;
            parent.target.roll = goal.rotate;       //claw rotation angle
            parent.target.rolldir = goal.direction; //claw rotation direction

            // format command string
            cmdstr += "," + parent.target.base;     //base rotunda
            cmdstr += "," + parent.target.shoulder; //shoulder DC motor
            cmdstr += "," + parent.target.elbow;    //elbow firgelli
            cmdstr += "," + parent.target.wrist;    //wrist pitch
            cmdstr += "," + goal.direction;         //claw rotation direction
            cmdstr += "," + goal.rotate;            //claw rotation angle
            cmdstr += "," + goal.grab;     //claw target angle
            cmdstr += "," + parent.laser;
            cmdstr += "?";

            parent.position.rolldir = goal.direction;
            parent.target.rolldir = goal.direction;

            // send command to SAMD21
            if(parent.serial.isOpen()){
                parent.serial.write(cmdstr);
            } else {
                parent.log.output(`REACTING ${parent.name} \n `, "Communication Error with " + SAMD21addr);
                parent.feedback("Communication Error with " + SAMD21addr);
            }
        };
        this.limitCurrent = function(obj){
            var cmdstr = "A";
            var lims = {    //translate the percentages to numbers between 0-1000 (or whatever resolution we need)
                "base": Math.floor(obj.base * (1000/100)),
                "shoulder": Math.floor(obj.shoulder * (1000/100)),
                "elbow": Math.floor(obj.elbow * (1000/100)),
                "wrist": Math.floor(obj.wrist * (1000/100)),
                "claw": Math.floor(obj.claw * (1000/100))
            };

            // update the current limits
            parent.current_limit.base = obj.base;
            parent.current_limit.shoulder = obj.shoulder;
            parent.current_limit.elbow = obj.elbow;
            parent.current_limit.wrist = obj.wrist;
            parent.current_limit.claw = obj.claw;

            // format command string
            cmdstr += "," + lims.base;   //rotunda limit
            cmdstr += "," + lims.shoulder;   //dc motor limit
            cmdstr += "," + lims.elbow;   //firgelli limit
            cmdstr += "," + lims.wrist;   //diff wrist limit
            cmdstr += "," + lims.claw;   //claw limit
            cmdstr += "?";

            // send command to SAMD21
            if(parent.serial.isOpen()){
                parent.serial.write(cmdstr);
            } else {
                parent.log.output(`REACTING ${parent.name} \n `, "Communication Error with " + SAMD21addr);
                parent.feedback("Communication Error with " + SAMD21addr);
            }
        };
    }
    
    react(input){  //put arm control logic here
        var name = input.name;
        var data = input.data;
        this.log.output(`REACTING ${this.name} \n `, "Received name '" + name + "', data '" + data + "'" );

        // Interpret the command
        switch(name){
            case "move":{
                this.log.output(`REACTING ${this.name}`, "Moving ARM");
                this.rectify(data);
                this.moveArm(data);
                break;
            }
            case "tool":{
                if(data.option !== "laser"){
                    this.log.output(`REACTING ${this.name}`, "Invalid tool packet");
                } else {
                    if(data.param === 1){       //activating laser
                        this.log.output(`REACTING ${this.name}`, "Activating Laser");
                    } else {                    //deactivating laser
                        this.log.output(`REACTING ${this.name}`, "Deactivating Laser");
                    }
                    this.turnLaser(data.param);
                }
                break;
            }
            case "claw":{
                var limits = {
                    "base": this.current_limit.base,
                    "shoulder": this.current_limit.shoulder,
                    "elbow": this.current_limit.elbow,
                    "wrist": this.current_limit.wrist,
                    "claw": data.force
                };
                this.limitCurrent(limits);
                this.moveClaw(data);

                break;
            }
            case "limit":{
                var limits = data;
                limits.claw = this.current_limit.claw;
                this.limitCurrent(limits);
                break;
            }
            default:
                this.log.output(`REACTING ${this.name}: `, "react(): Invalid Input");
                this.log.output(`REACTING ${this.name}`, "react(): Invalid Input");
        }

        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        clearInterval(this.reportInterval);
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name, `HALTING ${this.name}`);
    }
    resume() {
        this.reportInterval = setInterval(this.reportState, update_time);   //is update_time in this scope?
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name, `RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name, `IDLING ${this.name}`);
    }
}

module.exports = Arm;