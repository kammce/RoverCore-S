//GPS is currently set to update every 500ms (hardware)
//baud set to 9600 bps
"use strict";
var fs = require('fs');

var Neuron = require('../Neuron');
var EVK7P = require('./EVK7P');

class GPS extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        //this.i2c = i2c;
        this.model = model;
        this.GPS = new EVK7P();
        // Construct Class here
        // 
        var parent = this;
        var serialport = require('serialport');
        var SerialPort = serialport.SerialPort;
        this.port = new SerialPort("/dev/cu.usbmodem1411", {
            //initialize on port /dev/tty-usbserial1
            baudrate: 9600,
            parser: serialport.parsers.readline('\r\n')
            // look for return and newline at the end of each data packet
        });

        this.model.registerMemory('GPS');
        this.model.set('GPS',  {
            lat: 0,
            latDir: 0,
            long: 0,
            longDir: 0
        });

        var store = function(data) {
            parent.model.set('GPS', data);
        }

        this.port.on('open', this.showPortOpen);
        this.port.on('close', this.showPortClose);
        this.port.on('error', this.showError);
        this.port.on('data', function(data) {
                fs.appendFile('/tmp/test.txt', data + "\n", function (err) {

                });
        var parent = this;
       //this.parseNMEA(data);
        //updateModel();
        if(data.substring(0,6) === "$GPRMC"){
        //checks that correct NMEA sentence is used
        var piece = data.split(",",7);
            if (piece[2] !=="A") {
                console.log("NO GPS FIX");
            }
            else if(piece[2] ==="A") {
                //checks for fix first
                EVK7P.data = (data);
                EVK7P.nmeaType = piece[0];
                //piece 0 = $GPRMC
                EVK7P.utc = piece[1];
                //piece 1 = UTC time
                EVK7P.fix = piece[2];
                //piece 2 = A (which is good)
                EVK7P.lat = piece[3];
                var firstLat = EVK7P.lat.slice(0,2);
                var secondLat = EVK7P.lat.slice(2,10);
                var delimiter = "º";
                var latResult = firstLat+delimiter+secondLat;
                EVK7P.lat = latResult;
                //piece 3 = latitude number
                EVK7P.latDir = piece[4];
                //piece 4 = latitude cardianl direction
                EVK7P.long = piece[5];
                var firstLong = EVK7P.long.slice(0,3);
                var secondLong = EVK7P.long.slice(3,11);
                var longResult = firstLong+delimiter+secondLong;
                EVK7P.long = longResult;
                //piece 5 = longitude number
                EVK7P.longDir = piece[6];
                //piece 6 = longitude direction
                console.log(EVK7P.lat + " " + EVK7P.latDir + ", " + EVK7P.long + " " + EVK7P.longDir);
                //need to split lat and long into 2 vars each (lat1=37,lat2=25.97389, etc) 
                store({
                     lat: EVK7P.lat,
                     latDir: EVK7P.latDir,
                     long: EVK7P.long,
                     longDir: EVK7P.longDir,
                });
            }
           }
    });

        var update = setInterval(function() {
            //parent.parseNMEA();
            //parent.updateModel();
            // console log for debugging purposes
            parent.log.output(parent.model.get('GPS'));
             // console.log("0x69: " + parent.model.get('MPU2'));
        }, 500);
    }
    react(input) {
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
        //not sure why you'd idle the GPS..
    }
    showPortOpen() {
        console.log('open');
    }
    showError(error) {
        console.log("Error" + error);
    }
    showPortClose() {
        console.log("port closed!");
    }
}

module.exports = GPS; 
