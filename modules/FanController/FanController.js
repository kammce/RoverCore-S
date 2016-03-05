/*"use strict";

var Neuron = require('../Neuron');

class FanController extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        //Construct class here
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
    }
    decodeTEMP(temp) {
        if(temp>=0x80){
            return parseInt(temp,16)-256;
        } 
        else {
            return parseInt(temp,16);
        }
    }
    codeTEMP(value){
        if(value<0){
            return parseInt((value+256).toString(16),16);
        } else{
            return parseInt(value.toString(16),16);
        }
    }
    readTemp() {
        var TEMP = [];
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x20)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x21)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x22)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x23)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x24)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x25)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x26)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x27)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x28)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x29)));
        TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x78)));
        return TEMP;
    }
    writeTempLimits(UPPER_TEMP,LOWER_TEMP) {
        var UPPER = codeTEMP(UPPER_TEMP);
        var LOWER = codeTEMP(LOWER_TEMP);
        i2c.writeByte(0x2C,0x45,UPPER);
        i2c.writeByte(0x2C,0x47,UPPER);
        i2c.writeByte(0x2C,0x49,UPPER);
        i2c.writeByte(0x2C,0x4B,UPPER);
        i2c.writeByte(0x2C,0x4D,UPPER);
        i2c.writeByte(0x2C,0x4F,UPPER);
        i2c.writeByte(0x2C,0x51,UPPER);
        i2c.writeByte(0x2C,0x53,UPPER);
        i2c.writeByte(0x2C,0x55,UPPER);
        i2c.writeByte(0x2C,0x57,UPPER);
        i2c.writeByte(0x2C,0x44,LOWER);
        i2c.writeByte(0x2C,0x46,LOWER);
        i2c.writeByte(0x2C,0x48,LOWER);
        i2c.writeByte(0x2C,0x4A,LOWER);
        i2c.writeByte(0x2C,0x4C,LOWER);
        i2c.writeByte(0x2C,0x4E,LOWER);
        i2c.writeByte(0x2C,0x50,LOWER);
        i2c.writeByte(0x2C,0x52,LOWER);
        i2c.writeByte(0x2C,0x54,LOWER);
        i2c.writeByte(0x2C,0x56,LOWER);
        var TEMPLIMIT = [];
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x45)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x47)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x49)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4B)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4D)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4F)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x51)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x53)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x55)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x57)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x44)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x46)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x48)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4A)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4C)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4E)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x50)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x52)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x54)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x56)));
        return TEMPLIMIT;
    }  
     setRegister() {
        //ehhhhhh idk which ones I'm supposed to do. Gotta read that again
     }
     editRegister(CMD_ADDR,value) {
        i2c.writeByte(0x2C,CMD_ADDR,value);
        return i2c.readByte(0x2C,CMD_ADDR);
     }
     readRegister(CMD_ADDR) {
        return i2c.readByte(0x2C,CMD_ADDR);
     }
}

module.exports = FanController;
*/
"use strict";

var Neuron = require('../Neuron');

class FanController extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        this.TEMP = [];
        this.TEMPLIMIT = [];
        //Dummy vars just for testing purposes
        this.r0x20 = 0x7F;
        this.r0x21 = 0x7F;
        this.r0x22 = 0x7F;
        this.r0x23 = 0x7F;
        this.r0x24 = 0x7F;
        this.r0x25 = 0x7F;
        this.r0x26 = 0x7F;
        this.r0x27 = 0x7F;
        this.r0x28 = 0x7F;
        this.r0x29 = 0x7F;
        this.r0x78 = 0x7F;
        // Construct Class here
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
    }
    decodeTEMP(temp) {
        if(temp>=0x80){
            return parseInt(temp,16)-256;
        } 
        else {
            return parseInt(temp,16);
        }
    }
    codeTEMP(value){
        if(value>0){
            return value.toString(16);
        } else{
            return (value+256).toString(16);
        }
    }
    readTemp() {
        var i2c = this.i2c;
        /*
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x20)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x21)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x22)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x23)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x24)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x25)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x26)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x27)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x28)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x29)));
        this.TEMP.push(decodeTEMP(i2c.readByte(0x2C,0x78)));
        */
        this.TEMP.push(this.decodeTEMP(0x80));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x21)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x22)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x23)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x24)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x25)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x26)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x27)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x28)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x29)));
        this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,this.r0x78)));
        return this.TEMP;
    }
    writeTempLimits(UPPER_TEMP,LOWER_TEMP) {
        var UPPER = codeTEMP(UPPER_TEMP);
        var LOWER = codeTEMP(LOWER_TEMP);
        i2c.writeByte(0x2C,0x45,UPPER);
        i2c.writeByte(0x2C,0x47,UPPER);
        i2c.writeByte(0x2C,0x49,UPPER);
        i2c.writeByte(0x2C,0x4B,UPPER);
        i2c.writeByte(0x2C,0x4D,UPPER);
        i2c.writeByte(0x2C,0x4F,UPPER);
        i2c.writeByte(0x2C,0x51,UPPER);
        i2c.writeByte(0x2C,0x53,UPPER);
        i2c.writeByte(0x2C,0x55,UPPER);
        i2c.writeByte(0x2C,0x57,UPPER);
        i2c.writeByte(0x2C,0x44,LOWER);
        i2c.writeByte(0x2C,0x46,LOWER);
        i2c.writeByte(0x2C,0x48,LOWER);
        i2c.writeByte(0x2C,0x4A,LOWER);
        i2c.writeByte(0x2C,0x4C,LOWER);
        i2c.writeByte(0x2C,0x4E,LOWER);
        i2c.writeByte(0x2C,0x50,LOWER);
        i2c.writeByte(0x2C,0x52,LOWER);
        i2c.writeByte(0x2C,0x54,LOWER);
        i2c.writeByte(0x2C,0x56,LOWER);
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x45)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x47)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x49)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4B)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4D)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4F)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x51)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x53)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x55)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x57)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x44)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x46)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x48)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4A)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4C)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x4E)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x50)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x52)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x54)));
        TEMPLIMIT.push(decodeTEMP(i2c.readByte(0x2C,0x56)));
        return TEMPLIMIT;
    }  
     setRegister() {
        //ehhhhhh idk which ones I'm supposed to do. Gotta read that again
     }
     editRegister(CMD_ADDR,value) {
        i2c.writeByte(0x2C,CMD_ADDR,value);
        return i2c.readByte(0x2C,CMD_ADDR);
     }
     readRegister(CMD_ADDR) {
        return i2c.readByte(0x2C,CMD_ADDR);
     }
}

module.exports = FanController;