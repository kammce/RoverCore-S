var Neuron = require('../Neuron');
var exec = require('child_process').exec;
var fs = require("fs");

const sysFsPath = "/sys/class/gpio" ;
const Trigger   = 29;
const Echo      = 30;


class Ultrasonic extends Neuron
{
	constructor(util)
	{
		// =====================================
		// Bootstrapping Section (DO NOT CHANGE)
		// =====================================
		//// Calls parent class constructor
		super(util);
		////Assigns class's name
		this.name = util.name;
		/**
		 * Feedback mechanism for sending information back to mission control.
		 * Usage:
		 *		this.feedback(msg_to_output, ...);
		 * 		this.feedback("HELLO WORLD", { foo: "bar" });
		 */
		this.feedback = util.feedback;
		/**
		 * Abstraction library for printing to standard out in color as well
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.log.output(msg_to_output, ...);
		 *		this.log.output("HELLO WORLD", { foo: "bar" });
		 */
		this.log = util.log;
		this.log.setColor("red");
		/**
		 * This variable specifies the amount of time between react() calls before the
		 * idle() routine is called and the module state is moved to IDLING
		 */
		this.idle_timeout = 2000;
		/**
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.model.registerMemory("Proto");
		 *		this.model.set("Proto", {
		 *		    proto: 555
		 *		});
		 *		var proto = this.model.get("Proto");
		 */
		this.model = util.model;
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		this.model.registerMemory("Ultrasonic");
		this.Control_GPIO = [19,28,31,25];
		this.avg=0;
		this.MaxUltrasonic = 12;
		this.readDistance();
		// =====================================
		// Construct Class After This Points
		// =====================================
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
		this.log.output(`REACTING ${this.name}: `, input);
		this.feedback(`REACTING ${this.name}: `, input);
		return true;
	}
	/**
     * Init all GPIO pin.
     */
     init(){
     	var Trigger = 20;
    	var Echo = 21 ;
    	this.expose(Trigger);
    	this.expose(Echo);
    	this.expose(this.Control_GPIO[0]);
    	this.expose(this.Control_GPIO[1]);
    	this.expose(this.Control_GPIO[2]);
    	this.expose(this.Control_GPIO[3]);

    	this.direction(Trigger,"out");
    	this.direction(this.Control_GPIO[0],"out");
    	this.direction(this.Control_GPIO[1],"out");
    	this.direction(this.Control_GPIO[2],"out");
    	this.direction(this.Control_GPIO[3],"out");
	  	this.direction(Echo,"in");

    	fs.writeFileSync(sysFsPath + "/gpio" + Trigger + "/value", 1, "utf8");
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[0] + "/value", 0, "utf8");
		fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[1] + "/value", 0, "utf8");
		fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[2] + "/value", 0, "utf8");
		fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[3] + "/value", 0, "utf8");

     }
     /**
     * Use to execute shellscript command line.
     */
    puts(error, stdout, stderr){
    	console.log(stdout) 
    }
	/**
     * Use to expose GPIO pin for usage
     * @param {interger} input - set initially.
     */
    expose(pin){
    	exec("echo "+pin+ " > /sys/class/gpio/export" , this.puts);
    }
    /**
     * Set direction of a GPIO pin 
     * @param {interger} input - set initially.
     * @param {string} state - set initially.
     */
    direction(pin,state){
    	fs.writeFileSync(sysFsPath + "/gpio" + pin + "/direction", state);
    }
     /**
     * Write 1 or 0 to a single GPIO pin 
     * @param {interger} pin - GPIO pin number.
     * @param {string} value - value to be write to.
     */
    writeGPIO(pin, value) {
	    if (value === undefined) {
	        value = 0;
	    }
	    var sysFsPath = "/sys/class/gpio";
	    fs.writeFileSync(sysFsPath + "/gpio" + pin + "/value", value, "utf8");
	}
	 /**
     * Write 1 or 0 to four GPIO pin 
     * @param {interger array} pin_array - GPIOs pin nummber.
     * @param {string} value-x - value to be write to.
     */
	writeGPIO_MUX(value3, value2, value1, value0) {
	    if (value1 === undefined && value2 === undefined && value3 === undefined && value4 === undefined) {
	        value1 = 0;
	        value2 = 0;
	        value3 = 0;
	        value4 = 0;
	    }
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[0] + "/value", value0, "utf8");
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[1] + "/value", value1, "utf8");
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[2] + "/value", value2, "utf8");
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[3] + "/value", value3, "utf8");
	}
	 /**
     * Write 1 or 0 to four GPIO pin 
     * @param {interger } device_num - ultrasonic number.
     */
	muxSelect(device_num) {
		var parent=this;
	    switch (device_num) {
	        case 0:
	            parent.writeGPIO_MUX(0, 0, 0, 0);
	            break;
	        case 1:
	            parent.writeGPIO_MUX(0, 0, 0, 1);
	            break;
	        case 2:
	            parent.writeGPIO_MUX(0, 0, 1, 0);
	            break;
	        case 3:
	            parent.writeGPIO_MUX(0, 0, 1, 1);
	            break;
	        case 4:
	            parent.writeGPIO_MUX(0, 1, 0, 0);
	            break;
	        case 5:
	            parent.writeGPIO_MUX(0, 1, 0, 1);
	            break;
	        case 6:
	            parent.writeGPIO_MUX(0, 1, 1, 0);
	            break;
	        case 7:
	            parent.writeGPIO_MUX(0, 1, 1, 1);
	            break;
	        case 8:
	            parent.writeGPIO_MUX(1, 0, 0, 0);
	            break;
	        case 9:
	            parent.writeGPIO_MUX(1, 0, 0, 1);
	            break;
	        case 10:
	            parent.writeGPIO_MUX(1, 0, 1, 0);
	            break;
	        case 11:
	            parent.writeGPIO_MUX(1, 1, 0, 0);
	            break;
	         case 11:
	            parent.writeGPIO_MUX(1, 1, 0, 1);
	            break;
	        default:
	        	parent.log.output("Invalid Input");
	        	break;
	    	}
		}	
    /**
     * Cortex will attempt to halt this lobe in the following situations:
	 *		1. If the Mission Control controller of a lobe disconnects from the rover server or server proxy.
	 *		2. If the Mission Control controller sends a manual halt signal to Cortex to halt the lobe.
	 *		3. If another lobe uses an UPCALL to trigger the halt of a specific lobe or all lobes.
     * @returns {boolean} returns true if successful, returns false if halt failed.
     */
    measureDistanceMux(ultrasonicNum){
 		var parent = this;
	  	var start=0;
    	var end=0;
    	var duration=0;
	    var distance=0;
	    var distnaceAvg=0;
	    var count2=0; 

	        fs.writeFileSync(sysFsPath + "/gpio" + Trigger + "/value", 1, "utf8");
			setTimeout(function(){
			    var count=0;
			    fs.writeFileSync(sysFsPath + "/gpio" + Trigger + "/value", 0, "utf8");
			    while(fs.readFileSync(sysFsPath + "/gpio" + Echo + "/value","utf8")==0){
			        var hrTime1 = process.hrtime();
			        start=hrTime1[0] * 1000000000 + hrTime1[1]; 
			        count++;
			          if(count>200){ break; }
			    }

			    while(fs.readFileSync(sysFsPath + "/gpio" + Echo + "/value","utf8")==1){
			    	var hrTime2 = process.hrtime();
			    	end=hrTime2[0] * 1000000000 + hrTime2[1];
			    }

			    duration = end-start;
			    distance =(duration/1e6)*15.614; //convert ms to cm 
			    if(distance > 170 || distance < 0 ){distance= -1 ;}
			    parent.log,output(distance);
			    parent.updateModel(ultrasonicNum,distance);
			},.0020);
   }

   	readDistance()
   	{
   		var parent = this;
   		var selectNum = 0;
   		var count = 0;
   		this.init();
   		setInterval(function(){
   			parent.muxSelect(selectNum);
   			parent.measureDistanceMux(selectNum);
   			count++;
			parent.average(selectNum,count);
   			if(count == 11)
   			{
   				selectNum++;
   				parent.readModel();
   				count=0;
   				if(selectNum==parent.MaxUltrasonic){selectNum=0;}
   			}
   		},10);
   	}

   	updateModel(ID,distance)
   	{
   		this.model.set("Ultrasonic",{
   			ID: ID,
   			Distance: distance
   		})
   	}

   	average(ID,count)
   	{
   		var ultrasonic = this.model.get("Ultrasonic");
   		try{
	   		if(count<11)
	   		{
	   			this.avg= this.avg+ultrasonic["Distance"];
				//this.log.output("if avg: " + this.avg);
	   		}
	   		else
	   		{
	   			this.avg=(this.avg/10);
			        //this.log.output(this.avg);
	   			this.model.set("Ultrasonic",{
		   			ID: ID,
		   			AvgDistance: this.avg
	   			})
				this.avg=0;
	   		}
	   	}
	   	catch(err){this.log.output("Error")}
   	}

   	readModel()
   	{
   		var ultrasonic = this.model.get("Ultrasonic");
   		//this.log.output(ultrasonic);
   		try{
   			this.log.output("ID : " + ultrasonic["ID"] + " Avg Distance: " + ultrasonic["AvgDistance"]);
   		}	
   		catch(err){this.log.output("Error: " + err)};
   	}

        /**
     * Cortex will attempt to halt this lobe in the following situations:
	 *		1. If the Mission Control controller of a lobe disconnects from the rover server or server proxy.
	 *		2. If the Mission Control controller sends a manual halt signal to Cortex to halt the lobe.
	 *		3. If another lobe uses an UPCALL to trigger the halt of a specific lobe or all lobes.
     * @returns {boolean} returns true if successful, returns false if halt failed.
     */
	halt()
	{
		this.log.output(`HALTING ${this.name}`);
		this.feedback(`HALTING ${this.name}`);
		return true;
	}
	/**
     * Cortex will attempt to resume this lobe in the following situations:
	 *		1. If the Mission Control controller sends a manual resume signal to Cortex to resume a halted lobe.
	 *		2. If another lobe uses an UPCALL to trigger resume of a specific lobe or all lobes.
     * @returns {boolean} returns true if successful, returns false if resume failed.
     */
	resume()
	{
		this.log.output(`RESUMING ${this.name}`);
		this.feedback(`RESUMING ${this.name}`);
		return true;
	}
	/**
     * Cortex will attempt to IDLE your lobes if this lobe does not receive a command from mission control in the specified amount defined in the this.idle_timeout. file. This is useful for lobes that need period commands from mission control. Lobes are put into IDLING state ~100ms after they are constructed.
     * @returns {boolean} returns true if successful, returns false if idle failed.
     */
	idle()
	{
		this.log.output(`IDLING ${this.name}`);
		this.feedback(`IDLING ${this.name}`);
		return true;
	}
}

module.exports = Ultrasonic;
