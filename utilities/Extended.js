"use strict";

var extended_utitilites = {
	"serialport": require('serialport'),
	"blueport": require('./extended/BluetoothSerial'),
	"PCA9685PWMDriver": require('./extended/PCA9685PWMDriver'),
	"OdroidGPIODriver": require('./extended/OdroidGPIODriver')
};

module.exports = extended_utitilites;