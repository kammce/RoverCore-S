"use strict";

var mpu6050 = require('./MPU6050.js');
var i2c_bus = require('i2c-bus');
//var config = require('./config.json');
var log = function() {};
var i2c = i2c_bus.openSync(1);
var mpu = new mpu6050(i2c, log);
mpu.wakeUp();
var interval = setInterval(function () {
  mpu.readData();
  mpu.convertPosition();
  mpu.convertTemp();
  mpu.Log();
}, 1500);
mpu.sleep();
