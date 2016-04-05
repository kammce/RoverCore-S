"use strict";

var Neuron = require('../Neuron');
var PWMDriver = require("./TEST_i2c_to_pwm.js");

var freq = 1024; // freq = operating frequency of the servos
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
        this.tool = 0; //tool currently being held

        // Angular Bounds (Index convention: 0:wrist, 1:elbow, 2:base, 3:shoulder)
        var high = [ 180, 76, 180, 58 ];
        var low = [ 0, 0, 0, 0 ];
        this.pwmdriver = new PWMDriver(devAddr, freq, this.i2c, this.feedback);
        this.check_cycle_started = false;
        this.check_cycle = null;    //holds the timeoutObject that continuously checks motor position while they are moving
        
        // Used by react() mainly to determine direction of a continuous motor's movement;
        // -1 = ccw/retract, 0 = neutral, 1 = cw/extend
        // Also holds the previously applied usec/duty value
        this.reaction = {
            base: null,
            shoulder: null,
            elbow: null,
            wrist: null,
            wrist_r: null,
            wrist_l: null,
            claw: null
        }

        this.reached = {    // Used by react() to determine when to stop the motors
            base: false,
            shoulder: false,
            elbow: false,
            wrist: false,
            wrist_r: false,
            wrist_l: false,
            claw: false
        };

        this.savedposition = { // Used for an automated action
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0,
            wrist_r: 0,
            wrist_l: 0,
            claw: 0
        };
        this.target = { // This variable stores the current target position of the arm
            base: 0,
            shoulder: 0,
            elbow: 0,
            wrist: 0,
            wrist_r: 0,
            wrist_l: 0,
            claw: 0
        };
        this.position = { // This variable stores feedback from the motors
            base: 90,
            shoulder: 29,
            elbow: 38,
            wrist: 90,
            wrist_r: 0,
            wrist_l: 0,
            claw: 0
        };
        //must change idleposition vals
        this.idleposition = { // This variable is a preset "safe" position for use with switchTool()
            base: 5,
            shoulder: 5,
            elbow: 5,
            wrist: 5,
            wrist_r: 5, //may not need wrist or claw
            wrist_l: 5,
            claw: 5
        };
        //tool positions subject to change
        this.toolposition1 = { //This variable is a preset position for tool #1
            base: 11,
            shoulder: 11,
            elbow: 11,
            wrist: 11,
            wrist_r: 11,
            wrist_l: 11,
            claw: 11
        };
        this.toolposition2 = { //This variable is a preset position for tool #2
            base: 22,
            shoulder: 22,
            elbow: 22,
            wrist: 22,
            wrist_r: 22,
            wrist_l: 22,
            claw: 22
        };
        this.toolposition3 = { //This variable is a preset position for tool #3
            base: 33,
            shoulder: 33,
            elbow: 33,
            wrist: 33,
            wrist_r: 33,
            wrist_l: 33,
            claw: 33
        };

        this.isSafe = function(angles) {
            var goal = [angles.wrist, angles.elbow, angles.base, angles.shoulder];
            // If any one of the angles is out-of-bounds, return false;
            for (var i = 0; i < 4; i++) {
                if (goal[i] > high[i] || goal[i] < low[i]) {
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
                    Def:    [S/D bit] [O/S bit] [S_1] [S_0]     [Uni bit] [Sleep bit] [Arbitrary] [Arbitrary]
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
                // Need to map adc digital (voltage) output values to angles for each individual motor feedback channels
                switch(channel){
                    case 0: /*base motor channel:*/
                        // Type of input data: digital voltage reading
                        // --> I need to map servo's voltage ranges to angles
                        
                        // code that turns the base voltage feedback into angles
                        var temp = [data_byte[0],data_byte[1]];

                        /*Some digital value parsing formula I made up for testing...*/

                        
                        // positions.bpos = the resulting angle;
                        break;
                    // case 1: /*claw motor channel:*/
                    //     // Type of input data: digital voltage reading
                    //     // --> I need to map servo's voltage ranges to angles
                        
                    //     // code that turns the base voltage feedback into angles
                    //     var temp = [data_byte[0],data_byte[1]];
                        
                    //     // positions.cpos = the resulting angle;
                    //     break;

                    
                    case 2: /*elbow motor channel:*/
                        var temp = ((data_byte[0] << 8) | data_byte[1]) >> 5; //get rid of garbage zeroes and one highly varying bit

                        positions.epos = (temp / 1250) * 70;
                        break;
                    case 3: /*shoulder motor channel:*/
                        var temp = (data_byte[0] << 8) | data_byte[1] >> 4; //get rid of garbage zeroes

                        positions.spos = (temp / (1091-68)) * 39;    // (value/(total binary feedback range)) * (total angular range)
                        break;
                    default:
                }
            }

            return positions;
        };
        
        this.readMRE = function(device_address) {
            /*Code to get angle data "wpos_l" and "wpos_r" from magnetic encoders*/
        };
        
        this.readMPU = function(){
            /*Code to get angle data "wrist" from the MPU6050 accelerometer*/
        };

        this.check_pos = function(parent, ltc2309){ // Read all positional data from motors and update the arm's current position
            var threshold = 2;  // number of degrees where a reading represents a reached target
            var completed_motors = 0;   // number of motors that have reached their targets

            // Get all feedback readings
            var adc_val = parent.readadc(ltc2309);     //gets base, claw, elbow, and shoulder angles
            // var mre_val = parent.readMRE();             //gets wrist_l and wrist_r servo angles
            // var mpu_val = parent.readMPU();             //gets wrist pitch angles

            // Record all readings
            parent.position.base = adc_val.bpos;
            parent.position.claw = adc_val.cpos;
            parent.position.elbow = adc_val.epos;
            parent.position.shoulder = adc_val.spos;
            // parent.position.wrist_l = mre_val.wpos_l;
            // parent.position.wrist_r = mre_val.wpos_r;
            // parent.position.wrist = mpu_val;

            // if base has not reached position
            if( !( ( parent.position.base <= parent.target.base + threshold ) && ( parent.position.base >= parent.target.base - threshold) )  ){
                parent.check_cycle = setTimeout(parent.check_pos(parent, ltc2309));
            } else {
                // base is a non-continuous servo; it does not need to be told to stop
                completed_motors++;
            }

            // if shoulder has not reached position
            if( !( ( parent.position.shoulder <= parent.target.shoulder + threshold ) && ( parent.position.shoulder >= parent.target.shoulder - threshold) )  ){
                //If timeout not set
                if(parent.check_cycle === null){
                    parent.check_cycle = setTimeout(parent.check_pos(parent, ltc2309));
                }
            } else {
                // stop shoulder actuator
                parent.moveActuator("shoulder", "stop");
                completed_motors++;
            }

            // if elbow has not reached position
            if( !( ( parent.position.elbow <= parent.target.elbow + threshold ) && ( parent.position.elbow >= parent.target.elbow - threshold) )  ){
                //If timeout not set
                if(parent.check_cycle === null){
                    parent.check_cycle = setTimeout(parent.check_pos(parent, ltc2309));
                }
            } else {
                // stop elbow actuator
                parent.moveActuator("elbow", "stop");
                completed_motors++;
            }

            // // if wrist_r has not reached position
            // if( !( ( parent.position.wrist_r <= parent.target.wrist_r + threshold ) && ( parent.position.wrist_r >= parent.target.wrist_r - threshold) )  ){
            //     //If timeout not set
            //     if(parent.check_cycle === null){
            //         parent.check_cycle = setTimeout(parent.check_pos(parent, ltc2309));
            //     }
            // } else {
            //     // stop wrist_r servo
            //     parent.moveServo("wrist_r", "stop");
            //     completed_motors++;
            // }

            // // if wrist_l has not reached position
            // if( !( ( parent.position.wrist_l <= parent.target.wrist_l + threshold ) && ( parent.position.wrist_l >= parent.target.wrist_l - threshold) )  ){
            //     //If timeout not set
            //     if(parent.check_cycle === null){
            //         parent.check_cycle = setTimeout(parent.check_pos(parent, ltc2309));
            //     }
            // } else {
            //     // stop wrist_l servo
            //     parent.moveServo("wrist_l", "stop");
            //     completed_motors++;
            // }

            /*Will this be needed, since both wrist_r and wrist_l motors have already been checked?*/
            // // if wrist has not reached position
            // if( !( ( parent.position.wrist <= parent.target.wrist + threshold ) && ( parent.position.wrist >= parent.target.wrist - threshold) )  ){
            //     //If timeout not set
            //     if(parent.check_cycle === null){
            //         parent.check_cycle = setTimeout(parent.check_pos(parent, ltc2309));
            //     }
            // } else {
            //     // stop wrist servos
            //     parent.moveActuator("wrist_r", "stop");
            //     parent.moveActuator("wrist_l", "stop");
            //     completed_motors++;
            // }

            // if claw has not reached position
            if( !( ( parent.position.claw <= parent.target.claw + threshold ) && ( parent.position.claw >= parent.target.claw - threshold) )  ){
                //If timeout not set
                if(parent.check_cycle === null){
                    parent.check_cycle = setTimeout(parent.check_pos(parent, ltc2309));
                }
            } else {
                // claw is a non-continuous servo; it does not need to be told to stop
                completed_motors++;
            }

            // if(completed_motors === 7){
            //     parent.check_cycle_started = false;
            // }
        }

        this.moveServo = function(motor, angle){
            // This function only controls servos (i.e. the base and wrist joints)
            //FOR TESTING PURPOSES: Let 4095 = clockwise, 0 = counter clockwise (h bridge control FOR servo direction)
            //FOR TESTING PURPOSES: Let 4095 = full speed, 0 = stop  (servo speed control)
            var driver = this.pwmdriver;
            var current_pos = this.position;
            var servo_pin;
            var direction = 0;      //defaults to neutral for most motors, but continuous motors will get this changed below
            var movement = 1700;   //default to clockwise at max speed //this is the cw val for contin. servos

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
            //      I need to map angles to microsecond values
            switch(motor){
                case "base":{
                    /*pseudocode:
                    movement = f(angle) = some number of microseconds representing that angle; I still need to map the angles!
                    base motor:
                        1500us = middle;
                        1430us = 90* ccw;
                        1570us = 90* cw;
                    */
                    this.target.base = angle;
                    break;
                }
                case "wrist_r":{
                    if(angle < current_pos.wrist_r){
                        movement = 1300; //this is the ccw val for contin. servos
                        direction = -1;
                    }
                    this.target.wrist_r = angle;
                    break;
                }
                case "wrist_l":{
                    if(angle < current_pos.wrist_l){
                        movement = 1300; //this is the ccw val for contin. servos
                        direction = -1;
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
                usec: movement,
                dir: direction
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

        this.grab = function(angle) {
            this.moveServo("claw", angle);
        };

        this.switchTool = function(toolNumber) {
            var clawdetachangle = 0; //some angle for claw that detaches a tool???
            var temptarget = {
                base: 0,
                shoulder: 0,
                elbow: 0,
                wrist: 0,
                wrist_r: 0,
                wrist_l: 0,
                claw: 0
            };

            //end if toolNumber is already attached
            if (toolNumber == this.tool) {
                return "Tool already selected";
            }
            //end if toolNumber is out of bounds
            if (toolNumber < 0 || this.tool > 3) {
                return "Invalid tool";
            }

            //EMPTIES THE CLAW 
            if (this.tool > 0) {
                //set temptarget position for dropping tool
                switch (this.tool) {
                    case 1:
                        {
                            this.savedposition = this.position; //not used
                            temptarget = this.toolposition1; //makes tool position the target

                            break;
                        }
                    case 2:
                        {
                            this.savedposition = this.position; //not used
                            temptarget = this.toolposition2; //makes tool position the target

                            break;
                        }
                    case 3:
                        {
                            this.savedposition = this.position; //not used
                            temptarget = this.toolposition3; //makes tool position the target

                            break;
                        }
                    default:
                        {
                            return;
                        }
                }
            }
            //moving arm to a safe location
            //*******************************************
            this.moveServo("base", this.idleposition.base);
            this.moveActuator("shoulder", this.idleposition.shoulder);
            this.moveActuator("elbow", this.idleposition.elbow);
            //Insert delay
            // while(this.position.shoulder != this.idleposition.shoulder && this.position.elbow != this.idleposition.elbow)
            // {

            //     this.position = this.readadc(devAddr);

            //     if(this.position.shoulder == this.idleposition.shoulder)
            //     {
            //         this.moveActuator("shoulder", "stop");
            //     }
            //     if(this.position.elbow == this.idleposition.elbow)
            //     {
            //         this.moveActuator("elbow", "stop");
            //     }
            // }

            //moving arm to drop location
            //*******************************************
            this.moveServo("base", temptarget.base);
            this.moveServo("wrist_r", temptarget.wrist_r);
            this.moveServo("wrist_l", temptarget.wrist_l);
            //Possibly insert delay function so every single joint doesnt moveat the same time 
            // while(this.position.wrist_r != this.target.wrist_r && this.position.wrist_l != this.target.wrist_l)
            // {
            //     this.position = this.readadc(devAddr);

            //     if(this.position.wrist_r == this.target.wrist_r)
            //     {
            //         this.moveServo("wrist_r", "stop");
            //     }
            //     if(this.position.wrist_l == this.target.wrist_l)
            //     {
            //         this.moveServo("wrist_l", "stop");
            //     }
            // }

            this.moveActuator("shoulder", temptarget.shoulder);
            this.moveActuator("elbow", temptarget.elbow);
            //delay
            // while(this.position.shoulder != this.target.shoulder && this.position.elbow != this.target.elbow)
            // {
            //     this.position = this.readadc(devAddr);

            //     if(this.position.shoulder == this.target.shoulder)
            //     {
            //         this.moveActuator("shoulder", "stop");
            //     }
            //     if(this.position.elbow == this.target.elbow)
            //     {
            //         this.moveActuator("elbow", "stop");
            //     }
            // }

            // TEST MUST DECIDE IF THE ARM IS IN POSITION SO IT CAN DROP THE TOOL AND PROCEED
            //drops tool
            this.moveServo("claw", clawdetachangle); //detaches tool
            setTimeout(function() {}, 2000); //TEMPORARY TIME FOR ATTACH/DETACH
            this.tool = 0;
            //moving arm to tool area location
            //*******************************************              
            this.moveActuator("shoulder", this.idleposition.shoulder);
            this.moveActuator("elbow", this.idleposition.elbow);
            //Insert delay
            // while(this.position.shoulder != this.idleposition.shoulder && this.position.elbow != this.idleposition.elbow)
            // {
            //     this.position = this.readadc(devAddr);

            //     if(this.position.shoulder == this.idleposition.shoulder)
            //     {
            //         this.moveActuator("shoulder", "stop");
            //     }
            //     if(this.position.elbow == this.idleposition.elbow)
            //     {
            //         this.moveActuator("elbow", "stop");
            //     }
            // }

            //now we assume the claw has been successfully emptied 
            switch (toolNumber) {
                case 0:
                    {
                        //nothing because tool should be empty
                        return;
                    }
                case 1:
                    {
                        this.savedposition = this.position;
                        temptarget = this.toolposition1;

                        break;

                    }
                case 2:
                    {
                        this.savedposition = this.position;
                        temptarget = this.toolposition2;

                        break;
                    }
                case 3:
                    {
                        this.savedposition = this.position;
                        temptarget = this.toolposition3;

                        break;
                    }
            }

            //moving arm to tool location
            //*******************************************
            this.moveServo("base", temptarget.base);
            this.moveServo("wrist_r", temptarget.wrist_r);
            this.moveServo("wrist_l", temptarget.wrist_l);
            //Possibly insert delay function so every single joint doesnt moveat the same time
            // while(this.position.wrist_r != this.target.wrist_r && this.position.wrist_l != this.target.wrist_l)
            // {
            //     this.position = this.readadc(devAddr);

            //     if(this.position.wrist_r == this.target.wrist_r)
            //     {
            //         this.moveServo("wrist_r", "stop");
            //     }
            //     if(this.position.wrist_l == this.target.wrist_l)
            //     {
            //         this.moveServo("wrist_l", "stop");
            //     }
            // }

            this.moveActuator("shoulder", temptarget.shoulder);
            this.moveActuator("elbow", temptarget.elbow);
            //delay
            // while(this.position.shoulder != this.target.shoulder && this.position.elbow != this.target.elbow)
            // {
            //     this.position = this.readadc(devAddr);

            //     if(this.position.shoulder == this.target.shoulder)
            //     {
            //         this.moveActuator("shoulder", "stop");
            //     }
            //     if(this.position.elbow == this.target.elbow)
            //     {
            //         this.moveActuator("elbow", "stop");
            //     }
            // }

            this.moveServo("claw", temptarget.claw); //attaches tool
            setTimeout(function() {}, 2000); //TEMPORARY TIME FOR ATTACH/DETACH
            this.tool = toolNumber;

            //moving arm to a safe location
            //*******************************************              
            this.moveActuator("shoulder", this.idleposition.shoulder);
            this.moveActuator("elbow", this.idleposition.elbow);
            //moving shoulder and elbow
            // while(this.position.shoulder != this.idleposition.shoulder && this.position.elbow != this.idleposition.elbow)
            // {
            //     this.position = this.readadc(devAddr);

            //     if(this.position.shoulder == this.idleposition.shoulder)
            //     {
            //         this.moveActuator("shoulder", "stop");
            //     }
            //     if(this.position.elbow == this.idleposition.elbow)
            //     {
            //         this.moveActuator("elbow", "stop");
            //     }
            // }
        };
    }
    
    react(input){  //put arm control logic here
        var name = input.name;
        var data = input.data;
        this.log.output(`REACTING ${this.name} \n `, "name=" + name + " data=" + data );

        // Interpret the command
        switch(name){
            case "move":{
                if(this.isSafe(data)){
                    // this.reaction.base = this.moveServo("base", data.base);   //base not yet operational
                    // this.reaction.wrist this.moveServo("wrist", data.wrist); //wrist not operational for pitch yet
                    /*Pseudocode
                        wrist_l_angle = f(wrist_r_angle);   //given parameter data.wrist, gives wrist motors diff. angles to go to so that the wrist motors spin opposite directions and cause a pitch rise/fall
                    */
                    //below: moves servos the same direction; serves a dummy movement for now
                    this.reaction.wrist_r = this.moveServo("wrist_r", data.wrist);//wrist_r_angle);
                    this.reaction.wrist_l = this.moveServo("wrist_l", data.wrist);//wrist_l_angle);
                    this.reaction.elbow = this.moveActuator("elbow", data.elbow);
                    this.reaction.shoulder = this.moveActuator("shoulder", data.shoulder);
                    this.log.output(`REACTING ${this.name}`, "moving motors");
                }

                // Check a flag showing if you're already checking that the motors have reached their target position; if not, set to true and continue to compare the positions with the target, and shutdown each motor as they reach their goal
                switch(this.check_cycle_started){
                    case false:{
                        var parent = this;
                        var ltc_addr = devAddr;

                        parent.check_cycle_started = true;
                        this.log.output(`REACTING ${this.name}: `, "position check timeout has started");
                        setTimeout(parent.check_pos(parent, ltc_addr), 100);
                        break;
                    }
                    case true:{
                        /*Do nothing*/
                        break;
                    }
                    default:
                        this.log.output(`REACTING ${this.name}: `, "Invalid check_cycle_started");
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
                this.log.output(`REACTING ${this.name}`, "invalid input");
        }

        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name, `HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name, `RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name, `IDLING ${this.name}`);
    }
}

module.exports = Arm;