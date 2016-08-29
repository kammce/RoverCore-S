"use strict";

/*FOR TESTING PURPOSES*/
class Model {  // Dummy class resembling an instance of object Model from Matt's i2c to pwm library
    constructor(/*feedback*/){
        var parent = this;
        this.database = {};
        this.registerMemory = function(key){
            parent.database[key] = "";    //initialize the data
        }
        this.set = function(key, val){
            parent.database[key] = val;
        }
        this.get = function(key){
            return parent.database[key];
        }
    }
}
/***END FOR TESTING PURPOSES***/

module.exports = Model;