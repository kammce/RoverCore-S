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
        this.SciencePortName = "/dev/ttySCIENCECOM";
        this.LidPortName = "/dev/ttyACM0";
        var OnorOff = "off";
        var parent = this;        
        var SerialPort = serialport.SerialPort;
        var dataContainer = [];
        var average=0;
        var samplesize=0;
        var sum = 0;
        

        //define ports**************************************

        //temperature and moisture sensors
        var SciencePort = new SerialPort(this.SciencePortName,
        {
         //speed             parser
         baudRate:1200,    
         parser:serialport.parsers.readline("\r\n")
        });

        //the lid the lid the lid lid lid lid lid lid lid
        var LidPort = new SerialPort(this.LidPortName,
        {
         //speed             parser
         baudRate:9600,    
         parser:serialport.parsers.readline("\r\n")
        }); 
        
        this.scienceOn = function(sample){
                samplesize = sample;
                dataContainer.length=0;
                sum = 0;
                OnorOff = "on";
            
            console.log(OnorOff);

        }

        this.scienceOff = function(){
            OnorOff = "off";
        }

        this.onOpen = function onOpen(){
            console.log("Port opened"); 
        }

        this.onData = function (data){
            if (parseFloat(data) != 'NaN' && OnorOff == "on")
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

        this.closeLid = function (){
            LidPort.write('0');
            console.log("Lid closed.");
        } 

        this.openLid = function (){
            LidPort.write('1');
            console.log("Lid open.");
        } 

        SciencePort.on('open', this.onOpen);
        SciencePort.on('data', this.onData);
        LidPort.on('open',this.closeLid)


    }


    react(input) {
        var tool = input.tool;
        var state = input.state;
        var sample = input.sample;

        switch(tool)
        {
            case "Temperature":
            {
                if(state=="on")
                {
                    console.log("Temperature sensor with sample size "+sample+":\n");
                    this.scienceOn(sample);
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
                    this.scienceOn(sample);
                }
                else if(state == "off")
                {
                    console.log("Off");
                    this.scienceOff();
                }
                else console.log("Invalid input");

                break;
            }

            case "Lid":
            {
                if(state=="on"||state=="open")
                {
                    this.openLid();
                }
                else if(state=="off"||state=="close")
                {
                    this.closeLid();
                }
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