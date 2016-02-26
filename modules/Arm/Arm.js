"use strict";

var Neuron = require('../Neuron');
var PWMDriver = require("./TEST_i2c_to_pwm.js");

var freq = 1024;        // freq = operating frequency of the servos
var devAddr = 0x8; // LTC2309's i2c device address is 0001000 = 8 = 0x08
var mre = 0x01; //FOR TESTING PURPOSES: Assume the MRE's device address is 0x01

class Arm extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c; // holds link to a Bus object returned by i2c-bus.open(); will use to grab data off of motor-reading adc
        this.model = model;

        // Construct Class here
        // Angular Bounds (Index convention: 0:wrist, 1:elbow, 2:base, 3:shoulder)
        var high = [ 180, 76, 180, 58 ];
        var low = [ 0, 0, 0, 0 ];

        this.pwmdriver = new PWMDriver(devAddr, freq, this.i2c, this.feedback);
        this.reached = false;    // Used by react to determine when to stop the motors
        this.savedposition = {  // Used for an automated action
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0,
            wrist_r: 0,
            wrist_l: 0,
            claw: 0
        };
        this.target = {         // This variable stores the current target position of the arm
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0,
            wrist_r: 0,
            wrist_l: 0,
            claw: 0
        };
        this.position = {       // This variable stores feedback from the motors
            base: 90,
            shoulder: 29,
            elbow: 38,
            wrist: 90,
            wrist_r: 0,
            wrist_l: 0,
            claw: 0
        };
        this.isSafe = function(angles){
            var goal = [ angles.wrist, angles.elbow, angles.base, angles.shoulder ];
            // If any one of the angles is out-of-bounds, return false;
            for(var i = 0; i < 4; i++){
                if(goal[i] > high[i] || goal[i] < low[i]){
                    return false;
                }
            }

            return true;
        };
        this.readadc = function(device_address){
            // var fail = false;
            var positions = {
                bpos: null, //base servo
                spos: null, //shoulder actuator
                epos: null, //elbow actuator
                cpos: null  //claw servo
                // wpos_l: null,
                // wpos_r: null
            };
            
            // Get all angular data from the motors connected to the ADC
            for(var channel = 0; channel < 8; channel++){
                /*
                Write Byte Definition (6-bit word for configuring the ADC)
                    Format:    [1]       [x]     [y]   [z]         [1]        [0]        [0]       [0]
                    Def:    [S/D bit] [O/S bit] [S_1] [S_0]     [Uni bit] [Sleep bit] [Garbage] [Garbage]
                    Note: x,y, and z vary depending on selected channel (see LTC2309 datasheet p.11 table 1)
                */
                var write_byte = new Buffer(1);
                // Data Byte stores the received data (16 bits) from the ADC
                var data_byte = new Buffer(2);

                switch(channel){
                    case 0:     //base servo
                        write_byte[0] = 0x22 << 2;    // (100010 = 34) << 2 = 1000 1000
                        break;
                    case 1:     //claw servo
                        write_byte[0] = 0x32 << 2;    // (110010 = 50) << 2 = 1100 1000
                        break;
                    case 2:     //elbow (firgeli) actuator
                        write_byte[0] = 0x26 << 2;    // (100110 = 38) << 2 = 1001 1000
                        break;
                    case 3:     //shoulder (servo city) actuator
                        write_byte[0] = 0x36 << 2;    // (110110 = 54) << 2 = 1101 1000
                        break;
                    case 4:     //firgeli driver/current sensing (DRV8801 CS)
                        write_byte[0] = 0x2A << 2;    // (101010 = 42) << 2 = 1010 1000
                        break;
                    case 5:     //servo city driver/current sensing (MC33926 FB)
                        write_byte[0] = 0x3A << 2;    // (111010 = 58) << 2 = 1110 1000
                        break;
                    case 6:     //firgeli driver Fault indicator
                        write_byte[0] = 0x2E << 2;    // (101110 = 46) << 2 = 1011 1000
                        break;
                    case 7:     //servo city driver Fault indicator
                        write_byte[0] = 0x3E << 2;    // (111110 = 62) << 2 = 1111 1000
                        break;
                }

                // This should tell the adc-to-i2c chip (LTC2309) to switch channels to the desired motor feedback line
                if(!this.i2c.i2cWriteSync(device_address, 1, write_byte)){
                    this.log.output(`REACTING ${this.name}: `, "ADC config failed");
                    return "readadc() failed";
                }

                // This should read the data from the currently connected motor/device as a binary word
                if (!this.i2c.i2cReadSync(device_address, 2, data_byte)){   // writes to data_byte
                    this.log.output(`REACTING ${this.name}: `, "ADC reading failed");
                    return "readadc() failed";
                }

                /*  >>Pseudocode
                // This code parses the data from the different motors differently depending on the motor and 
                // puts the data to their corresponding keys in var "positions" in the form of ANGLES
                // first 12 bits constitute the data (12th bit = LSB), last 4 zeroes are garbage
                */
                switch(channel){
                    case 0: /*base motor channel:*/
                        // Type of input data: digital voltage reading
                        // --> I need to map servo's voltage ranges to angles
                        
                        // code that turns the base voltage feedback into angles
                        var temp = [data_byte[0],data_byte[1]];
                        
                        // positions.bpos = the resulting angle;
                        break;
                    case 1: /*claw motor channel:*/
                        // Type of input data: digital voltage reading
                        // --> I need to map servo's voltage ranges to angles
                        
                        // code that turns the base voltage feedback into angles
                        var temp = [data_byte[0],data_byte[1]];
                        
                        // positions.cpos = the resulting angle;
                        break;
                    case 2: /*elbow motor channel:*/
                        // Type of input data: digital voltage reading
                        // --> I need to map actuators' voltage ranges to distances, then actuation distances to angles
                        
                        // code that turns the actuator's voltage feedback to actuation distances, then that to angles
                        var temp = [data_byte[0],data_byte[1]];

                        // positions.bpos = the resulting angle;
                        break;
                    case 3: /*shoulder motor channel:*/
                        // Type of input data: digital voltage reading
                        // --> I need to map actuators' voltage ranges to distances, then actuation distances to angles
                        
                        // code that turns the actuator's voltage feedback to actuation distances, then that to angles
                        var temp = [data_byte[0],data_byte[1]];

                        // positions.bpos = the resulting angle;
                        break;
                    default:
                }
            }

            return positions;
        };
        this.readMRE = function(device_address){
            /*Code to get angle data "wpos_l" and "wpos_r" from magnetic encoders*/
        };
        this.moveServo = function(motor, angle){
            // This function only controls servos (i.e. the base and wrist joints)
            //FOR TESTING PURPOSES: Let 4095 = clockwise, 0 = counter clockwise (h bridge control FOR servo direction)
            //FOR TESTING PURPOSES: Let 4095 = full speed, 0 = stop  (servo speed control)
            var driver = this.pwmdriver;
            var current_pos = this.position;
            var servo_pin;
            // var h_bridge_pin = 0x0F;    //FOR TESTING PURPOSES: Let 0x0F = pin where Servo H-bridge is connected
            var movement = 1700;   //default to clockwise at max speed //this is the cw val for contin. servos, is it for 180* servos?

            // Determine which motor to move
            switch(motor){
                case "base":{
                    servo_pin = 6;//2;
                    break;
                }
                case "wrist_r":{
                    servo_pin = 7;//4;
                    break;
                }
                case "wrist_l":{
                    servo_pin = 8;//5;
                    break;
                }
                case "claw":{
                    servo_pin = 9;
                    break;
                }
                default:
                    return "FAIL_moveServo()";
            }

            if(angle === "stop"){   //only applies to wrist servos
                switch(motor){
                    case "wrist_r":{
                        // Set speed of rotation to zero
                        driver.setMICRO( servo_pin , 1500 );    //1500 = halfway signal = stop microsec time (based on experiment)
                        break;
                    }
                    case "wrist_l":{
                        // Set speed of rotation to zero
                        driver.setMICRO( servo_pin , 1500 );    //1500 = halfway signal = stop microsec time (based on experiment)
                        break;
                    }
                    default:
                    // base and claw act as normal, non continuous servos, and thus do not need to be told to stop
                }
                return "stopped";
            }

            // Determine movement (position for non-cont. servos, direction for cont. servos)
            //  Need to map angles to microsecond values
            switch(motor){
                case "base":{
                    /*pseudocode:
                    movement = f(angle) = some number of microseconds representing that angle; I still need to map the angles!
                    */
                    this.target.base = angle;
                    break;
                }
                case "wrist_r":{
                    if(angle < current_pos.wrist_r){
                        movement = 1300; //this is the ccw val for contin. servos
                    }
                    this.target.wrist_r = angle;
                    break;
                }
                case "wrist_l":{
                    if(angle < current_pos.wrist_l){
                        movement = 1300; //this is the ccw val for contin. servos
                    }
                    this.target.wrist_l = angle;
                    break;
                }
                case "claw":{
                    /*pseudocode:
                    movement = f(angle) = some number of microseconds representing that angle; I still need to map the angles!
                    */
                    this.target.claw = angle;
                    break;
                }
                default:
                    return "FAIL_moveServo()";
            }

            // Move servos (for continuous servos, clockwise < 1500 < counterclockwise?)
            driver.setMICRO( servo_pin , movement );
            return {
                usec: movement,//micro,
                dir: movement
            };
        };
        this.moveActuator = function(motor, angle){
            // This function only controls actuators (i.e. the shoulder and elbow joints)
            //FOR TESTING PURPOSES: Let 100 = clockwise, 0 = counter clockwise (h bridge control FOR servo direction)
            //FOR TESTING PURPOSES: Let 100 = full speed, 0 = stop  (servo speed control)
            var driver = this.pwmdriver;
            var current_pos = this.position;
            var actuator_pin;
            var h_bridge_pin;// = 0x0E;    //FOR TESTING PURPOSES: Let 0x0F = pin where Actuator H-bridge is connected
            var direction = 100;   //default to clockwise
            var duty = 100;

            // Determine which motor to move
            switch(motor){
                case "elbow":{
                    actuator_pin = 11;//1;
                    h_bridge_pin = 10;
                    break;
                }
                case "shoulder":{
                    // actuator_pin = 3;
                    h_bridge_pin = 12; //= ?;    Shoulder has no Hbridge?!?! Has internal Direction control?? 12=V+ pin, 13=V- pin
                    break;
                }
                default:
                    return "FAIL_moveActuator()";
            }

            if(angle === "stop"){
                // Set speed of rotation to zero
                switch(motor){
                    case "shoulder":{
                        driver.setDUTY( h_bridge_pin , 0 ); // set pin 12 = V+ to low
                        driver.setDUTY( h_bridge_pin+1 , 0 ); //set pin 13 = V- to low
                        break;
                    }
                    case "elbow":{
                        driver.setDUTY( actuator_pin , 0 );
                    }
                    default:
                }
                return "stopped";
            }

            // Determine direction of actuation
            switch(motor){
                case "elbow":{
                    if(angle < current_pos.elbow){
                        direction = 0;
                    }
                    this.target.elbow = angle;
                    break;
                }
                case "shoulder":{
                    if(angle < current_pos.shoulder){
                        direction = 0;
                    }
                    this.target.shoulder = angle;
                    break;
                }
                default:
                    return "FAIL_moveActuator()";
            }

            // Command actuators
            switch(motor){
                case "shoulder":{
                    var direction2 = 0;
                    if(direction === 0){
                        direction2 = 100;
                    }

                    // Set direction of actuation
                    driver.setDUTY( h_bridge_pin , direction ); //pin 12 = V+
                    driver.setDUTY( h_bridge_pin+1 , direction2 ); //pin 13 = V-
                    // // Set speed of actuation
                    // driver.setDUTY( actuator_pin , duty );   //looks like speed cannot be controlled
                    break;
                }
                case "elbow":{
                    // Set direction of actuation
                    driver.setDUTY( h_bridge_pin , direction );
                    // Set speed of actuation
                    driver.setDUTY( actuator_pin , duty );
                    break;
                }
                default:

            }
            return {
                duty_cycle: duty,
                dir: direction
            };
        };
        // this.claw = function(){};
        // this.switchTool = function(){};
        // this.tool = function(){};
    }
    react(input) {  //put arm control logic here
        var name = input.name;
        var data = input.data;

        // Interpret the command
        switch(name){
            case "move":{
                if(this.isSafe(data)){
                    // this.moveServo("base", data.base);
                    // this.moveServo("wrist", data.wrist);
                    // this.moveActuator("elbow", data.elbow);
                    // this.moveActuator("shoulder", data.shoulder);
                }
                break;
            }
            case "tool":{

                break;
            }
            case "claw":{

                break;
            }
            default:
                this.log.output(`REACTING ${this.name}: `, "Invalid Input");
        }

        // Check a flag if the motors have reached their target position; if not, continue to compare the positions with the target, and shutdown each motor as they reach their goal
        var reached = this.reached;
        var parent = this;
        var ltc_addr = devAddr;
        setTimeout(function(parent, ltc_addr){
            // Read all positional data from motors and update the arm's current position
            var temp = parent.readadc(ltc_addr);
            parent.position.base = temp.bpos;
            parent.position.shoulder = temp.spos;
            parent.position.elbow = temp.epos;
            parent.position.wrist_l = temp.wpos_l;
            parent.position.wrist_r = temp.wpos_r;
            /*Determine wrist yaw angle*/
            // parent.position.wrist = 

            // if(/*a motor has reached its target and not all motors have reached their targets*/){
            //     // Stop the said motor

            //     return;
            // }
            // else if(/*a motor has */){

            // }
            // else {
            //     /*invoke readadc again!!!*/
            // }

        }, 50);

        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
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

module.exports = Arm;