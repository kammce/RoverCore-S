"use strict";

// var SerialPort = require('serialport').SerialPort;  //Library for serial link; using serial-port
var SerialPort = require('../TEST_serialport.js');  // For Unit Testing
var Neuron = require('../Neuron');

class Arm extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        var parent = this;
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c; // holds link to a Bus object returned by i2c-bus.open(); will use to grab data off of motor-reading adc
        this.model = model;
        this.tool = 0; //tool currently being held
        
        // Angular Bounds (Index convention: 0:wrist, 1:elbow, 2:base, 3:shoulder)
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

        // Arm state records
        this.laser = 0; //defaults to off
        this.target = { // This variable stores the current target position of the arm
            "base": 0,
            "shoulder": 0,
            "elbow": 0,
            "wrist": 0,
            "roll": 0,
            "rolldir": 0,
            "claw": "r"
        };
        this.current = {
            "base": 0,
            "shoulder": 0,
            "elbow": 0,
            "wrist": 0,
            "claw": 0
        };
        this.position = { // This variable stores feedback from the motors
            "base": 90,
            "shoulder": 29,
            "elbow": 38,
            "wrist": 90,
            "roll": 180,
            "rolldir": 0,
            "claw": "r"
        };

        // Register model memory
        this.model.registerMemory("Arm_State");  //current state of Arm; current draw, positions, target positions

        // Create Serialport connection
        this.serial = new SerialPort("/dev/tty-addressOfSamd21", {  // SAMD21 serial port address
            baudrate: 9600
        });

        // Define serial connection startup behavior
        this.serial.on("open", function(){
            parent.log.output(`REACTING ${parent.name} \n `, "SAMD21 serial connection made!");
        });

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
            
            // record positions
            parent.position.wrist = parseInt(data[0]);    //wrist diff gerabox pitch
            parent.position.shoulder = parseInt(data[1]); //shoulder DC motor pitch
            parent.position.roll = parseInt(data[2]);     //wrist diff gearbox roll angle
            parent.position.elbow = parseInt(data[3]);    //elbow firgelli pitch angle (determined by pot feedback)
            parent.position.base = parseInt(data[4]);     //base rotunda angle
            parent.position.claw = parseInt(data[5]);            //claw servo angle

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
                target: parent.target
            };
            parent.model.set("Arm_State", ArmPresentState);
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
            parent.serial.write("<,A?");
        };
        this.turnLaser = function(state){
            var cmdstr = ">";

            // update the Arm's laser state
            parent.laser = state;

            // format command string
            cmdstr += "," + parent.target.base;      //base rotunda
            cmdstr += "," + parent.target.shoulder;  //shoulder DC motor
            cmdstr += "," + parent.target.elbow;     //elbow firgelli
            cmdstr += "," + parent.target.claw;
            cmdstr += "," + parent.target.wrist;     //wrist pitch
            cmdstr += "," + parent.target.rolldir;
            cmdstr += "," + parent.target.roll;
            cmdstr += "," + state;
            cmdstr += "?";
            
            // send command to SAMD21
            parent.serial.write(cmdstr);
        };
        this.moveArm = function(goal){
            var cmdstr = ">";

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
            cmdstr += "," + parent.target.claw;
            cmdstr += "," + goal.wrist;     //wrist pitch
            cmdstr += "," + parent.target.rolldir;
            cmdstr += "," + parent.target.roll;
            cmdstr += "," + parent.laser;
            cmdstr += "?";
            
            // send command to SAMD21
            parent.serial.write(cmdstr);
        };
        this.moveClaw = function(goal){
            var cmdstr = ">";

            // update the Arm's target position
            if(goal.grab === 0){            //release
                parent.target.claw = "r";       //claw grab (?)
            } else {                        //grab
                if(goal.force > 100){
                    goal.force = 100;
                } else if(goal.force < 0) {
                    goal.force = 0;
                }
                parent.target.claw = "g" + goal.force;
            }
            parent.target.roll = goal.rotate;       //claw rotation angle
            parent.target.rolldir = goal.direction; //claw rotation direction

            // format command string
            cmdstr += "," + parent.target.base;     //base rotunda
            cmdstr += "," + parent.target.shoulder; //shoulder DC motor
            cmdstr += "," + parent.target.elbow;    //elbow firgelli
            cmdstr += "," + parent.target.claw;     //claw release/(grab+force) 
            cmdstr += "," + parent.target.wrist;    //wrist pitch
            cmdstr += "," + goal.direction;         //claw rotation direction
            cmdstr += "," + goal.rotate;            //claw rotation angle
            cmdstr += "," + parent.laser;
            cmdstr += "?";

            parent.position.rolldir = goal.direction;
            parent.target.rolldir = goal.direction;

            // send command to SAMD21
            parent.serial.write(cmdstr);
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
                this.moveClaw(data);
                break;
            }
            default:
                this.log.output(`REACTING ${this.name}: `, "Invalid Input");
                this.log.output(`REACTING ${this.name}`, "invalid input");
        }

        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name, `HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name, `RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name, `IDLING ${this.name}`);
    }
}

module.exports = Arm;