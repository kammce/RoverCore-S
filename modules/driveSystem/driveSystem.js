"use strict";

//  string to send to smd
//smxxvxxaxxe

//  string to get from smd
// Current ,a0.00,

var Neuron = require('../Neuron');

class DriveSystem extends Neuron {
    constructor(util) {
        super(util);
        this.name = util.name;
        this.feedback = util.feedback;
        this.log = util.log;
        this.idle_time = util.idle_timeout;
        this.i2c = util.i2c;
        this.model = util.model;
        
        var parent = this;
        
        const retryLimit = 50;
        const INTERVAL_TIME = 100;
        const SETUP_TIME = 5000;
        var trys = 0;

        /* sendState: will send goal states to the FIST-MCU 
         * (Feedback influenced Steering and Travel system) */ 
        var sendState = function () {
            if(parent.port.isOpen()) {
                if(parent.mode !== parent.modeOld){
                    parent.log.output('M' + parent.mode + "E");
                    parent.port.write('M' + parent.mode + "E" + "\n");
                    parent.modeOld = parent.mode;
                }
                if((parent.speed !== parent.speedOld) || (parent.angle !== parent.angleOld)){
                        var speed_str = 'S' + zeroPad(parent.speed, 3) + ',' + zeroPad(parent.angle, 3) +"E" + "\n";
                        parent.log.output("speed_str = ", speed_str);
                        parent.port.write(speed_str, function(err, results) {});
                        parent.speedOld = parent.speed;
                        parent.angleOld = parent.angle;
                }
                 if(parent.limit !== parent.limitOld){
                    parent.port.write('L' + parent.limit + "E");
                    parent.limitOld = parent.limit;
                }
                else if(parent.PIDState !== parent.PIDStateOld){
                    parent.port.write('P' + parent.PIDState + "E");
                    parent.PIDStateOld = parent.PIDState;
                }
            }
        }

        ////////////////
        this.state = 'react';
        this.speed = 0;
        this.speedOld = 0;
        this.angle = 90;
        this.angleOld = 90;
        this.limit = 50;
        this.limitOld = 50;
        this.PIDState = 'on';
        this.PIDStateOld = 'off';
        this.mode = 'z'; 
        // z is arbitrary, and forces sendState to send a k
        this.modeOld = 'z';
        /////////////////
        this.port = new util.serial.SerialPort("/dev/FIST-MCU", {
            baudrate: 9600,
            parser: util.serial.parsers.readline('\n')
        }, false); // false = disable auto open

        /* Serial Open Routine: will continously attempt to access the 
         * serialport until retry limit has been met. */
        var serialOpenRoutine = (err) => {
            if(trys >= retryLimit) {
                return;
            } else if (err) { 
                this.log.output("Failed to open /dev/FIST-MCU", trys);
                this.feedback("Failed to open /dev/FIST-MCU");
                trys++;
                setTimeout(() => {
                    this.log.output("Reattempting to open /dev/FIST-MCU", trys);
                    this.feedback("Reattempting to open /dev/FIST-MCU");
                    this.port.open(serialOpenRoutine);
                }, 2000);
                return;
            } else {
                setTimeout(() => {
                    this.interval = setInterval(sendState, INTERVAL_TIME);
                }, SETUP_TIME);
            }
        };
        // Attempt to open Serial port
        this.port.open(serialOpenRoutine);
        // Listen for data on the serial port
        this.port.on('data', (data) => {
            this.log.output("RECIEVED" + data.toString());
        });
        // Handle Error events by sending them back to mission control
        this.port.on("err", (err) => {
            this.log.output("Communication error with /dev/driveSystemMCU");
            this.feedback("Communication error with /dev/driveSystemMCU");
        });
    }
    react(input) {
        //if(this.state === 'react'){
            this.log.output("React was called");
            this.log.output("input = ", input);
            this.speed = input.speed;
            this.angle = input.angle;
            this.mode = input.mode;
            this.limit = input.limit;
            this.PIDState = input.PIDState;
            this.log.output(`REACTING ${this.name}: `, input);
            this.feedback(this.name ,`REACTING ${this.name}: `, input);
            //console.log("DATA that was Recieved" + input.toString());
            //this.port.write(input.toString());
            //this.port.write("\n");
            /*return true;

        }
        else{
            return false;
        }*/
    }
    halt() {
        this.state = 'halt';
        if(this.port.isOpen()) {
            this.port.write('S000,090E');
        }
        this.speed = 0;
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.state = 'react';
        //this.interval = setInterval(this.sendState(), 100);
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        this.state = 'idle';
        if(this.port.isOpen()) {
            this.port.write('S000,090E');
        }
        this.speed = 0;
        //clearInterval(this.interval);
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
        //this.port.write('S000,090E');
                
    }
}
/*var dataSplit;
 this.cur=['a','b','c','d','e','f'];
        this.rpm=['a','b','c','d','e','f'];
                    if(data[0] === 'r' && data.includes('\n')){
                        dataSplit = data.split(",");
                         parent.rpm.a = parseInt(['0x' + dataSplit[1]]);
                         parent.rpm.b = parseInt(['0x' + dataSplit[2]]);
                         parent.rpm.c = parseInt(['0x' + dataSplit[3]]);
                         parent.rpm.d = parseInt(['0x' + dataSplit[4]]);
                         parent.rpm.e = parseInt(['0x' + dataSplit[5]]);
                         parent.rpm.f = parseInt(['0x' + dataSplit[6]]);
                    }
                    else if(data[0] === 'c' && data.includes('\n')){
                         dataSplit = data.split(",");
                         parent.cur.a = parseInt(['0x' + dataSplit[1]])/100;
                         parent.cur.b = parseInt(['0x' + dataSplit[2]])/100;
                         parent.cur.c = parseInt(['0x' + dataSplit[3]])/100;
                         parent.cur.d = parseInt(['0x' + dataSplit[4]])/100;
                         parent.cur.e = parseInt(['0x' + dataSplit[5]])/100;
                         parent.cur.f = parseInt(['0x' + dataSplit[6]])/100;
                    }
                    else {
                        console.log("Data Error!");
                    }

                    else{
            this.port = port;
            this.port.on('data', function (data){
                var dataSplit;
                if(data[0] === 'r' && data.includes('\n')){
                    dataSplit = data.split(",");
                     this.rpm.a = parseInt(['0x' + dataSplit[1]]);
                     this.rpm.b = parseInt(['0x' + dataSplit[2]]);
                     this.rpm.c = parseInt(['0x' + dataSplit[3]]);
                     this.rpm.d = parseInt(['0x' + dataSplit[4]]);
                     this.rpm.e = parseInt(['0x' + dataSplit[5]]);
                     this.rpm.f = parseInt(['0x' + dataSplit[6]]);
                }
                else if(data[0] === 'c' && data.includes('\n')){
                     dataSplit = data.split(",");
                     this.cur.a = parseInt(['0x' + dataSplit[1]])/100;
                     this.cur.b = parseInt(['0x' + dataSplit[2]])/100;
                     this.cur.c = parseInt(['0x' + dataSplit[3]])/100;
                     this.cur.d = parseInt(['0x' + dataSplit[4]])/100;
                     this.cur.e = parseInt(['0x' + dataSplit[5]])/100;
                     this.cur.f = parseInt(['0x' + dataSplit[6]])/100;
                }
                else {
                    console.log("Data Error!");
                }
            });
            this.interval = setInterval(sendState, 100);
        }*/

module.exports = DriveSystem;