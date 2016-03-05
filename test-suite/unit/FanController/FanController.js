/*
"use strict";

var Protolobe = require('../../../modules/Protolobe/Protolobe');

describe('Testing Protolobe Class', function () {
    var log = function() { }
    log.output = function(input) {};
    var feedback = function(input) {};
    var i2c = function() {}; // filler i2c object (not used in test)
    var model = function() {}; // filler model object (not used in test)

    var test_lobe = new Protolobe("Protolobe", feedback, log, 4000, i2c, model);

    describe('Testing Protolobe Methods', function () {
        it('#react() should be called', function () {
            test_lobe.react("TESTING");
            expect(expected_log).to.equal(`REACTING ${test_lobe.name}: TESTING`);
            expect(expected_feedback).to.equal(`ProtolobeREACTING ${test_lobe.name}: TESTING`);
        });
        it('#halt() should be called', function () {
            test_lobe.halt();
            expect(expected_log).to.equal(`HALTING ${test_lobe.name}`);
            expect(expected_feedback).to.equal(`ProtolobeHALTING ${test_lobe.name}`);
        });
        it('#resume() should be called', function () {
            test_lobe.resume();
            expect(expected_log).to.equal(`RESUMING ${test_lobe.name}`);
            expect(expected_feedback).to.equal(`ProtolobeRESUMING ${test_lobe.name}`);
        });
        it('#idle() should be called', function () {
            test_lobe.idle();
            expect(expected_log).to.equal(`IDLING ${test_lobe.name}`);
            expect(expected_feedback).to.equal(`ProtolobeIDLING ${test_lobe.name}`);
        });
    });
});
*/
/*
"use strict";

var FanController = require('../../../modules/FanController/FanController.js');
var unittest = new FanController();
var temp;
var UPPER_TEMP = 128,LOWER_TEMP = -128;
var value;

describe('Fan Controller Class',function(){
    describe('readTemp(CMD_ADDR);', function(){
        it('should recieve byte information for temperature',function(){
            expect(unittest.readTemp()).to.be.a('array');
        });
        it('should have 10 values in the array',function(){
            expect(unittest.readTemp()).to.have.length(11);
        });
    });
    describe('decodeTEMP(temp);', function(){
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x7D';
            expect(unittest.decodeTEMP(temp)).to.be.equal(125);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x19';
            expect(unittest.decodeTEMP(temp)).to.be.equal(25);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x00';
            expect(unittest.decodeTEMP(temp)).to.be.equal(0);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0xFF';
            expect(unittest.decodeTEMP(temp)).to.be.equal(-1);
        });
        it('should properly conver btye temp to Celius form', function(){
            temp = '0x80';
            expect(unittest.decodeTEMP(temp)).to.be.equal(-128);
        });
    });
    describe('writeTempLimits(UPPER_TEMP, LOWER_TEMP)',function(){
        it('should send data as a byte',function(){
            expect(unittest.writeTempLimits(UPPER_TEMP,LOWER_TEMP)).to.be.a('array');
        });
        it('should return an array of lenth 20',function(){
            expect(unittest.writeTempLimits(UPPER_TEMP,LOWER_TEMP)).to.have.length(20);
        });
        it('values 0-9 should be equal to UPPER_TEMP',function(){
            var TEMPLIMITS = unittest.writeTempLimits(UPPER_TEMP,LOWER_TEMP);
            var foo = true;
            for(i=0;i<10;i++){
                if(TEMPLIMITS[i]!==UPPER_TEMP){
                    foo = false;
                }
            }
            expect(foo).to.be.true;
        });
        it('values 10-19 should be equal to LOWER_TEMP',function(){
            var TEMPLIMITS = unittest.writeTempLimits(UPPER_TEMP,LOWER_TEMP);
            var foo = true;
            for(i=10;i<20;i++){
                if(TEMPLIMITS[i]!==LOWER_TEMP){
                    foo = false;
                }
            }
            expect(foo).to.be.true;
        });
    });
    describe('codeTemp(value)',function(){
        it('should properly convert Celius to a byte', function(){
            temp = 0;
            expect(unittest.codeTemp(temp)).to.be.a(byte);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 0;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x00);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 25;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x19);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 125;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x7D);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = -10;
            expect(unittest.codeTEMP(temp)).to.be.equal(0xF6);
        });
        it('should properly conver btye temp to Celius form', function(){
            temp = -128;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x80);
        });
    });
    describe('setRegister()',function(){
        it('should return an array',function(){
            expect(unittest.setRegister()).to.be.a('array');
        });
        it('array should be length _____',function(){
            expect(unittest.setRegister()).to.have.length(1); // I dont know the length yet
        });
    });
    describe('editRegister(CMD_ADDR,value)',function(){
        it('should ',function(){
            expect(unittest.editRegister(value)).to.be.a('byte');
        });
    });
    describe('readRegister(CMD_ADDR)',function(){
        it('should read a byte value', function(){
            expect(unittest.readRegister(CMD_ADDR)).to.be.a('byte');
        });
    });
}); */
"use strict";

var file = require('../../../modules/FanController/FanController.js');
var expect = require('chai').expect;
var temp;
    var dev_addr1 =[], dev_addr2 =[];
    var register1 =[], register2 =[];
    var command1 =[], command2 =[];
    class i2c_bus{
        constructor(something1, something2, something3) {
            
        }
        writeByteSync(dev_addr, register, command){
            dev_addr1.push(dev_addr);
            register1.push(register);
            command1.push(command);
            
        }
        readByteSync(dev_addr, register){
            return register;
        }
        writeByte(dev_addr, register, command, cb){
            dev_addr2.push(dev_addr);
            register2.push(register);
            command2.push(command);
        }
        readByte(dev_addr, register, cb){

        }
        reset(){
            dev_addr1 =[], dev_addr2 =[];
            register1 =[], register2 =[];
            command1 =[], command2 =[];
        }
    };

var i2c = new i2c_bus();
var model = function(){};
var log = function() { }
    log.output = function(input) { 
        expected_log = "";
        for (var i = 0; i < arguments.length; i++) {
            if(typeof arguments[i] === "object") {
                expected_log += JSON.stringify(arguments[i])+"\n";
            } else {
                expected_log += arguments[i];
            }
        }
    };

    var feedback = function(input) { 
        expected_feedback = "";
        for (var i = 0; i < arguments.length; i++) {
            if(typeof arguments[i] === "object") {
                expected_feedback += JSON.stringify(arguments[i])+"\n";
            } else {
                expected_feedback += arguments[i];
            }
        } 
    };
var unittest = new file("Fan Controller", feedback,log,4000,i2c,model);
var UPPER_TEMP = 128;
var LOWER_TEMP = 0;
var CMD_ADDR;
var value;

describe('Fan Controller Class',function(){
    describe('readTemp();', function(){
        unittest.readTemp();
        it('should recieve byte information for temperature',function(){
            expect(unittest.TEMP[0]).to.be.equal(25);
        });
        it('should have 10 values in the array',function(){
            expect(unittest.readTemp()).to.have.length(11);
        });
    });
    describe('decodeTEMP(temp);', function(){
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x7D';
            expect(unittest.decodeTEMP(temp)).to.be.equal(125);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x19';
            expect(unittest.decodeTEMP(temp)).to.be.equal(25);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x00';
            expect(unittest.decodeTEMP(temp)).to.be.equal(0);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0xFF';
            expect(unittest.decodeTEMP(temp)).to.be.equal(-1);
        });
        it('should properly conver btye temp to Celius form', function(){
            temp = '0x80';
            expect(unittest.decodeTEMP(temp)).to.be.equal(-128);
        });
    });
    describe('wrtieTempLimits(UPPER_TEMP, LOWER_TEMP',function(){
        it('should send data as a byte',function(){
            expect(unittest.writeeTempLimits(UPPER_TEMP,LOWER_TEMP)).to.be.a('array');
        });
        it('should return an array of lenth 20',function(){
            expect(unittest.writeTempLimits(UPPER_TEMP,LOWER_TEMP)).to.have.length(20);
        });
        it('values 0-9 should be equal to UPPER_TEMP',function(){
            var TEMPLIMITS = unittest.writeTempLimits(UPPER_TEMP,LOWER_TEMP);
            var foo = true;
            for(i=0;i<10;i++){
                if(TEMPLIMITS[i]!==UPPER_TEMP){
                    foo = false;
                }
            }
            expect(foo).to.be.true;
        });
        it('values 10-19 should be equal to LOWER_TEMP',function(){
            var TEMPLIMITS = unittest.writeTempLimits(UPPER_TEMP,LOWER_TEMP);
            var foo = true;
            for(i=10;i<20;i++){
                if(TEMPLIMITS[i]!==LOWER_TEMP){
                    foo = false;
                }
            }
            expect(foo).to.be.true;
        });
    });
    describe('codeTemp(value)',function(){
        it('should properly convert Celius to a byte', function(){
            temp = 0;
            expect(unittest.codeTemp(temp)).to.be.a(byte);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 0;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x00);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 25;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x19);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 125;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x7D);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = -10;
            expect(unittest.codeTEMP(temp)).to.be.equal(0xF6);
        });
        it('should properly conver btye temp to Celius form', function(){
            temp = -128;
            expect(unittest.codeTEMP(temp)).to.be.equal(0x80);
        });
    });
    describe('setRegister()',function(){
        it('should return an array',function(){
            expect(unittest.setRegister()).to.be.a('array');
        });
        it('array should be length _____',function(){
            expect(unittest.setRegister()).to.have.length(1); // I dont know the length yet
        });
    });
    describe('editRegister(CMD_ADDR,value)',function(){
        it('should ',function(){
            expect(unittest.editRegister(value)).to.be.a('byte');
        });
    });
    describe('readRegister(CMD_ADDR)',function(){
        it('should read a byte value', function(){
            expect(unittest.readRegister(CMD_ADDR)).to.be.a('byte');
        });
    });
});
