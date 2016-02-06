"use strict";

var Neuron = require('../Neuron');

/*FOR TESTING PURPOSES*/
class PWM_Driver {  // Dummy class resembling an instance of object PWM_Driver from Matt's i2c to pwm library
    constructor(address, frequency, i2c, log){
        this.setDUTY = function (pin, duty){    // controls linear actuators

        }
        this.setMICRO = function (pin, micro){  // controls servos

        }
    }
}
var freq = 1024;        // freq = operating frequency of the servos
/***END FOR TESTING PURPOSES***/


class Arm extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c; // holds link to a Bus object returned by i2c-bus.open(); will use to grab data off of motor-reading adc
        this.model = model;

        // Construct Class here
        var devAddr = 0x00;
        this.pwmdriver = new PWM_Driver(devAddr, freq, this.i2c, this.feedback);
        this.savedposition = {  // Used for an automated action
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0
        };
        this.target = {         // This variable stores the current target position of the arm
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0
        }
        this.position = {       // This variable stores feedback from the motors
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0
        };
        this.isSafe = function(angles){
            // Index convention: 0:wrist, 1:elbow, 2:base, 3:shoulder
            var high = [ 180, 180, 180, 180 ];
            var low = [ 0, 0, 0, 0 ];
            var goal = [ angles.wrist, angles.elbow, angles.base, angles.shoulder ];

            // If any one of the angles is out-of-bounds, return false;
            for(var i = 0; i < 4; i++){
                if(goal[i] > high[i] || goal[i] < low[i]){
                    return false;
                }
            }

            return true;
        };
        this.readadc = function(devAddr){
            var fail = false;
            var bufsize = 8;
            var buff = new Buffer(bufsize);
            var positions = {
                bpos: null,
                spos: null,
                epos: null,
                wpos_l: null,
                wpos_r: null
            }
            this.i2c.readI2cBlock(devAddr, 0x1F, bufsize, buff, function(err, bytesRead, buffer){
                if(err){
                    console.log(err);
                    fail = true;
                }
                else{
                    // console.log("Read " + bytesRead + " bytes: " + buff.toString("utf8"));  // debugging
                    // positions.bpos = 0;
                    // positions.spos = 0;
                    // positions.epos = 0;
                    // positions.wpos_l = 0;
                    // positions.wpos_r = 0;

                    /*Emulates the writing of bytes to the buffer*/
                    buff[0] = 0x41;
                    buff[1] = 0x41;
                    buff[2] = 0x41;
                    buff[3] = 0x41;
                    buff[4] = 0x41;
                    buff[5] = 0x41;
                    buff[6] = 0x41;
                    buff[7] = 0x41;
                }
            });

            if(fail){
                return "readadc()_FAILURE";
            }
            else{
                positions.bpos = buff[0];
                positions.spos = buff[1];
                positions.epos = buff[2];
                positions.wpos_l = buff[3];
                positions.wpos_r = buff[4];
                // console.log("Results: " + JSON.stringify(positions));   // debugging
                return positions;
            }            
        };
        this.moveServo = function(){
            var driver = this.pwmdriver;
            driver.setMICRO()
        };
        // this.moveActuator = function(){};
        // this.claw = function(){};
        // this.switchTool = function(){};
        // this.tool = function(){};
    }
    react(input) {  //put arm control logic here
        

        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
    }
}

module.exports = Arm;