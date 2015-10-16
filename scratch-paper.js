/* This file is a test file that can be used for anything.
 * It is basically scratch paper for something you need to
 * implement later.
 */
"use strict";
/*
var chai = require('chai')
  , spies = require('chai-spies');

chai.use(spies);

var should = chai.should()
  , expect = chai.expect;

//or you can track object methods calls
var array = [ 1, 2, 3 ];
var spy = chai.spy.on(array, 'push');

//and you can reset the object calls
console.log(array.push);
array.push(5);

//and you can reset the object calls
console.log(array.push);
*/

var events = require('events');
var eventEmitter = new events.EventEmitter();

class Test {
    constructor() {
    	this.number = 0;
    }
    displayNumber() {
    	console.log("Number: "+this.number);
    }
    emitNewNumber() {
    	var parent = this;
    	var change = function(value) {
    		parent.number = value;
    	}
    	eventEmitter.emit('caller', change);
    }
}

class Listen {
    constructor() {
    	var standard = function(callback) {
    		console.log("standard was run!");
    		callback(5);
    	}
        eventEmitter.on('caller', standard);
    }
}

var t = new Test();
var l = new Listen();

t.displayNumber();
t.emitNewNumber();
t.displayNumber();