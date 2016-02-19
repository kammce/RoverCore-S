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
"use strict";

var FanController = require('../../../modules/FanController/FanController.js');
var unittest = new FanController();
var temp;

describe('Fan Controller Class',function(){
    describe('readTemp(CMD_ADDR);', function(){
        it('should recieve byte information for temperature',function(){
            expect(readTemp()).to.be.a('array');
        });
        it('should have 10 values in the array',function(){
            expect(readTemp()).to.have.length(11);
        });
    });
    describe('decodeTEMP(temp);', function(){
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x7F';
            expect(decodeTEMP(temp)).to.be.equal('175');
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x22';
            expect(decodeTEMP(temp)).to.be.equal('25');
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0x00';
            expect(decodeTEMP(temp)).to.be.equal('0');
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = '0xFF';
            expect(decodeTEMP(temp)).to.be.equal('-1');
        });
        it('should properly conver btye temp to Celius form', function(){
            temp = '0x80';
            expect(decodeTEMP(temp)).to.be.equal('-128');
        });
    });
    describe('wrtieTempLimits(UPPER_TEMP, LOWER_TEMP',function(){
        it('should send data as a byte',function(){
            expect(wrtieTempLimits(UPPER_TEMP,LOWER_TEMP)).to.be.a('array');
        });
        it('should return an array of lenth 20',function(){
            expect(wrtieTempLimits(UPPER_TEMP,LOWER_TEMP)).to.have.length(20);
        });
        it('values 0-9 should be equal to UPPER_TEMP',function(){
            var TEMPLIMITS = wrtieTempLimits(UPPER_TEMP,LOWER_TEMP);
            var foo = true;
            for(i=0;i<10;i++){
                if(TEMPLIMITS[i]!==UPPER_TEMP){
                    foo = false;
                }
            }
            expect(foo).to.be.true;
        });
        it('values 10-19 should be equal to LOWER_TEMP',function(){
            var TEMPLIMITS = wrtieTempLimits(UPPER_TEMP,LOWER_TEMP);
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
            expect(codeTemp(value)).to.be.equal(0x00)
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 25;
            expect(decodeTEMP(temp)).to.be.equal(0x22);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = 175;
            expect(decodeTEMP(temp)).to.be.equal(0x7F);
        });
        it('should properly convert byte temp to Celius form',function(){
            temp = -1;
            expect(decodeTEMP(temp)).to.be.equal(0xFF);
        });
        it('should properly conver btye temp to Celius form', function(){
            temp = -128;
            expect(decodeTEMP(temp)).to.be.equal(0x80);
        });
    });
    describe('setRegister()',function(){
        it('should return an array',function(){
            expect(setRegister()).to.be.a('array');
        });
        it('array should be length _____',function(){
            expect(setRegister()).to.have.length(1); // I dont know the length yet
        });
    });
    describe('editRegister(CMD_ADDR,value)',function(){
        it('should ',function(){
            expect(editRegister(value)).to.be.a('byte');
        });
    });
    describe('readRegister(CMD_ADDR)',function(){
        it('should read a byte value', function(){
            expect(readRegister(CMD_ADDR)).to.be.a('byte');
        });
    });
});