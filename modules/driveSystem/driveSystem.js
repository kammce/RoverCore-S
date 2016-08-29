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
                    parent.log.output(`M${parent.mode}E`);
                    parent.port.write(`M${parent.mode}E\n`);
                    parent.modeOld = parent.mode;
                }
                if((parent.speed !== parent.speedOld) || (parent.angle !== parent.angleOld)){
                        var speed_str = `S${parent.speed},${parent.angle}E\n`;
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
        const FIST_PATH = "/dev/ttyFIST";
        this.port = new util.serial.SerialPort(FIST_PATH, {
            baudrate: 9600,
            parser: util.serial.parsers.readline('\n')
        }, false); // false = disable auto open

        /* Serial Open Routine: will continously attempt to access the
         * serialport until retry limit has been met. */
        var serialOpenRoutine = (err) => {
            if(trys >= retryLimit) {
                return;
            } else if (err) {
                this.log.output(`Failed to open ${FIST_PATH}`, trys);
                this.feedback(`Failed to open ${FIST_PATH}`);
                trys++;
                setTimeout(() => {
                    this.log.output(`Reattempting to open ${FIST_PATH}`, trys);
                    this.feedback(`Reattempting to open ${FIST_PATH}`);
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
            this.log.output("Communication error with ", FIST_PATH);
            this.feedback("Communication error with ", FIST_PATH);
        });
    }
    react(input) {
        this.speed = input.speed;
        this.angle = input.angle;
        this.mode = input.mode;
        this.limit = input.limit;
        this.PIDState = input.PIDState;
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        if(this.port.isOpen()) {
            this.port.write('S000,090E');
        }
        this.speed = 0;
        this.angle = 90;
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        if(this.port.isOpen()) {
            this.port.write('S000,090E');
        }
        this.speed = 0;
        this.angle = 90;
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);

    }
}

module.exports = DriveSystem;