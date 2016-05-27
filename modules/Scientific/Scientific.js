// // type   name    function   library
// var serialport = require('serialport');   
// var SerialPort = serialport.SerialPort;
// //var prompt = require('prompt');
//   //prompt.start();

//   //user enters a third argument, being the serialport
//   var portName = "/dev/ttyUSB0";


// //arduino object created with
// var port = new SerialPort(portName,
// {
//   //speed             parser
//   baudRate:1200,    
//   parser:serialport.parsers.readline("\r\n")
// });




// var degrees;

// port.on('open', onOpen);
// port.on('data', onData);

// function onOpen(){
// 	console.log("Open sesame");  
// }

// function onData(data){
// 	if (parseFloat(data) !== 'NaN')
// 	{console.log(parseFloat(data));}
// }

// function end(){
// 	console.log("Goodbye");
// 	return 0;
// }

"use strict";

var Neuron = require('../Neuron');
var serialport = require('serialport');   
var SerialPort = serialport.SerialPort;
var prompt = require('prompt');


class Scientific extends Neuron {
	constructor(name, feedback, color_log, idle_timeout, i2c, model) {
		super(name, feedback, color_log, idle_timeout);
		this.name = name;
		this.feedback = feedback;
		this.log = color_log;
		this.idle_time = idle_timeout;
		this.i2c = i2c;
		this.model = model;
		this.portName = "/dev/ttyUSB0";
		this.portName2 = "/dev/ttyUSB0";
		var OnorOff = "off";
		var parent = this;        
		var SerialPort = serialport.SerialPort;
		var dataContainer = [];
		var average=0;
		var samplesize=0;
		var sum = 0;
		var port = new SerialPort(this.portName,

		{
         //speed             parser
         baudRate:1200,    
         parser:serialport.parsers.readline("\r\n")
     });

		var port2 = new SerialPort(this.portName,

		{
         //speed             parser
         baudRate:1200,    
         parser:serialport.parsers.readline("\r\n")
     });
        // Construct Class here


    this.scienceOn1 = function(sample){
        	samplesize = sample;
        	dataContainer.length=0;
        	sum = 0;
        	OnorOff = "on1";
        // getPrompt();
        
        console.log(OnorOff);

    }

    this.scienceOn2 = function(sample){
        	samplesize = sample;
        	dataContainer.length=0;
        	sum = 0;
        	OnorOff = "on2";
        // getPrompt();
        
        console.log(OnorOff);

    }

    this.scienceOff = function(){
    	OnorOff = "off";
    }

    this.onOpen = function onOpen(){
    	console.log("Open sesame"); 
    }

    this.onData1 = function (data){
    	if (parseFloat(data) != 'NaN' && OnorOff == "on1")
    	{

    		if(samplesize == 0)console.log(parseFloat(data));

    		else
    		{

    			sum = sum + parseFloat(data);
    			dataContainer.push(parseFloat(data));

    			if(dataContainer.length == samplesize)
    			{
    				average = sum/samplesize;
                    // var variance = 0;
                    // for (var i = 0; i < samplesize; i++) {
                    //     variance += ((average - dataContainer[i])*(average - dataContainer[i]));
                    // }

                    // variance = variance/samplesize;
                    // var deviation = Math.sqrt(variance);

                    // console.log("average: " + average.toFixed(2) + "\tstandard deviation: " + deviation.toFixed(2));
                    console.log("average: " + average.toFixed(2));
                    dataContainer.length=0;
                    sum = 0;
                }
                

            }
        }
    }

    this.onData2 = function (data){
    	if (parseFloat(data) != 'NaN' && OnorOff == "on2")
    	{

    		if(samplesize == 0)console.log(parseFloat(data));

    		else
    		{

    			sum = sum + parseFloat(data);
    			dataContainer.push(parseFloat(data));

    			if(dataContainer.length == samplesize)
    			{
    				average = sum/samplesize;
                    // var variance = 0;
                    // for (var i = 0; i < samplesize; i++) {
                    //     variance += ((average - dataContainer[i])*(average - dataContainer[i]));
                    // }

                    // variance = variance/samplesize;
                    // var deviation = Math.sqrt(variance);

                    // console.log("average: " + average.toFixed(2) + "\tstandard deviation: " + deviation.toFixed(2));
                    console.log("average: " + average.toFixed(2));
                    dataContainer.length=0;
                    sum = 0;
                }
                

            }
        }
    }

    port.on('open', this.onOpen1);
    port.on('data', this.onData1);
    port2.on('open', this.onOpen2);
    port2.on('data', this.onData2);


}


react(input) {
	var sensor = input.sensor;
	var state = input.state;
	var sample = input.sample;

	switch(sensor)
	{
		case "Temperature":
		{
			if(state=="on")
			{
				console.log("Temperature sensor with sample size "+sample+":\n");
				this.scienceOn1(sample);
			}
			else if(state == "off")
			{
				console.log("Off");
				this.scienceOff();
			}
			else console.log("Invalid input");

			break;
		}

		case "Moisture":
		{
			if(state=="on")
			{
				console.log("Moisture sensor with sample size "+sample+":\n");
				this.scienceOn2(sample);
			}
			else if(state == "off")
			{
				console.log("Off");
				this.scienceOff();
			}
			else console.log("Invalid input");

			break;
		}

		default:
		console.log("Tool does not exist");
		break;
	}
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
}

//var swag = new Scientific();
// swag.scienceOn();




module.exports = Scientific;
