"use strict";



//  string to send to smd
//smxxvxxaxxe

//  string to get from smd
// Current ,a0.00,

var Neuron = require('../Neuron');

class DriveSystem extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model, port) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        this.port = port;
        ////////////////
        this.state = 'react';
        this.speed = 0;
        this.speedOld = 1;
        this.angle = 90;
        this.angleOld = 91;
        this.limit = 50;
        this.limitOld = 51;
        this.PIDState = 'on';
        this.PIDStateOld = 'off';
        this.mode = 'c';
        this.modeOld = 'k'
        //////////////////
        this.interval = setInterval(this.sendState(), 100);
        this.cur=['a','b','c','d','e','f'];
        this.rpm=['a','b','c','d','e','f'];
        this.port.on('data', function (data){
            
            if(arr[0] == 'r' && str.includes('\n')){
                rpm.a = parseInt(['0x' + arr[1]]);
                rpm.b = parseInt(['0x' + arr[2]]);
                rpm.c = parseInt(['0x' + arr[3]]);
                rpm.d = parseInt(['0x' + arr[4]]);
                rpm.e = parseInt(['0x' + arr[5]]);
                rpm.f = parseInt(['0x' + arr[6]]);
            }
            else if(arr[0] == 'c' && str.includes('\n')){
                cur.a = parseInt(['0x' + arr[1]])/100;
                cur.b = parseInt(['0x' + arr[2]])/100;
                cur.c = parseInt(['0x' + arr[3]])/100;
                cur.d = parseInt(['0x' + arr[4]])/100;
                cur.e = parseInt(['0x' + arr[5]])/100;
                cur.f = parseInt(['0x' + arr[6]])/100;
            }
            else {
                console.log("Data Error!")
            }
        });
        // Construct Class here
    }
    sendState(){
        if(this.mode != this.modeOld){
            port.write('M' + this.mode + "\n");
            this.modeOld = this.mode;
        }
        if((this.speed != this.speedOld) || (this.angle != this.angleOld)){
            port.write('S' + this.speed + ',' + this.angle +"\n");
            this.speedOld = this.speed;
            this.angleOld = this.angle;
        }
        if(this.limit != this.limitOld){
            port.write('L' + this.limit + "\n");
            this.limitOld = this.limit;
        }
        if(this.PIDState != this.PIDStateOld){
            port.write('P' + this.PIDState + "\n");
            this.PIDStateOld = this.PIDState;
        }
        //port.write('sm' + this.mode + 'v' + this.speed + 'a' + this.angle + 'e');
    }
    react(input) {
        if(this.state == 'react'){
            this.speed = input.speed;
            this.angle = input.angle;
            this.mode = input.mode;
            this.limit = input.limit;
            this.PIDState = input.PIDState;
            this.log.output(`REACTING ${this.name}: `, input);
            this.feedback(this.name ,`REACTING ${this.name}: `, input);
            return true;
        }
        else{
            return false;
        }
    }
    halt() {
        this.state = 'halt';
        clearInterval(this.interval);
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.state = 'react';
        this.interval = setInterval(this.sendState(), 100);
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        this.state = 'idle';
        clearInterval(this.interval);
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
    }
}


module.exports = ProtoLobe;