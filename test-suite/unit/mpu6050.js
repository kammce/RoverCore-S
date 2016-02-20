"use strict";
var mpu6050 = require('./MPU6050.js');
var expect = require('chai').expect;
var testes = new mpu6050();
//var xpos = 1000, ypos = 5000, zpos = 6969;

testes.readData();
testes.convert();

describe('Position: ', function() {
  describe('Convert position values: ', function() {
    it('Expected to be converted', function() {
      expect(testes.xangle).to.equal(57.295*Math.atan(parseFloat(testes.ypos)/ Math.sqrt(Math.pow(parseFloat(testes.zpos),2)+Math.pow(parseFloat(testes.xpos),2))));
    });
    it('Expected to be converted', function() {
      expect(testes.yangle).to.equal(57.295*Math.atan(parseFloat(testes.xpos)/ Math.sqrt(Math.pow(parseFloat(testes.zpos),2)+Math.pow(parseFloat(testes.ypos),2))));
    });
  });
});
describe('Temperature: ', function() {
  describe('Set temperature: ', function() {
    it('Expected temp to be a string', function() {
      expect(testes.temp).to.be.a('string');
    });
    it('Expected to be 16 bits', function() {
      expect(testes.temp).to.have.length(16);
    });
  });
  describe('Convert temp: ', function() {
    it('Expected to be converted to celcius', function() {
      expect(testes.celsius).to.equal(parseFloat(testes.temp)/340 + 36.53);
    })
  });
});
describe('Display', function() {
  it('Expected to return the 3 values', function() {
    expect(testes.Display()).to.eql("x-angle: ", testes.xangle, ", y-angle: ", testes.yangle, ", degrees C: ", testes.celsius, ".");
  })
});
