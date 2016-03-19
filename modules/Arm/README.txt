=================
Arm System README - Branch Arm added 2/5/16
=================

TODO:
    1.> Wait for Sean's documentation outlining which motors are connected to which channes on the LTC2309 ADC
    2.> Develop Servo/Acutator movement algorithm

Arm/End effector input from the interface (the command member object), following the standard lobe convention, should be in this format:
{
        target: “ARM”,    //lobe name
        command: {
            name: <name of command to issue>,
            data: <object associated with the name>
        }
}

Command Format Synopsis:
Arm Movement
            name: "move",
            data:  {
                        "base": [int],          //  desired angle of base (angle limits TBD)
                        "shoulder": [int],      //  desired angle of shoulder (angle limits TBD)
                        "elbow": [int],         //  desired angle of elbow (angle limits TBD)
                        "wrist": [int]          //  desired angle of wrist (angle limits TBD)
                    }
Tool Manipulation
            name: "tool",
            data:  {
                        "option": [string],    //  choose "switch", "operate"
"param": [int]
                    }
Claw Manipulation
        name: “claw”,
        data:    {
            (TBD)
            }
Member Descriptions:
    (String) name: "The string representing the name of the command you wish to execute"
        Choose from one of the following options:
            "move": Specifies an arm movement command
            "tool": Specifies a tool/probe command
            “claw”: Specifies an end-effector (claw) movement command
    (Object) data: "The object containing the parameters for the system specified"
        Required object members vary depending on the system, see below:
        members for name "move"
            (int) base: Specifies the desired angle of the base
            (int) shoulder: Specifies the desired angle of the shoulder
            (int) elbow: Specifies the desired angle of the elbow
            (int) wrist: Specifies the desired angle of the wrist
        members for name "tool”
            (string) "option":
                Choose one from the following:
                "switch": Switch tool
                "operate": Specifies a tool operation command (Q: will this vary by tool?)
            (int) "param": An integer within a range that varies by "command" (see below)
                command "switch":
                    0-? = tool number (index on cnc rack); 0 is reserved for holstering the tool (i.e. removing the tool from the claw)
                command “operate”:
                    (TBD)


Notes:
    Testing the whole package:
        Open up 3 terminals;
        On one, goto /var/www/html/sjsu-robotics/middleman and run "node index.js"
        On another, goto /var/www/html/sjsu-robotics/mission-control-2 and run "grunt server"
        On the last one, goto /var/www/html/sjsu-robotics/rovercore-v2 and run "node RoverCore.js"

    Using I2C to interact with the motors (using chip designed by Sean Setterfield (Arm EE)):
        Getting input/sending output to the arm motors will be done via i2c. One need only send the pin num of the output channel to a "sender" chip (will have a certain i2c address) that is connected to the desired motor, and you can read output data by receiving input from a "receiver" chip (an analog-to-digital converter (ADC), will have a certain i2c address) which should output its data from the corresponding pin number (as was done with sending data).

        Process for getting data from Sean's chip:
            1.> Via i2c, send the address of the adc that will give me input from the motors using an i2c writing function, probably from i2c-bus library (motor feedback adc comes from the ADC to i2c chip named LTC2309, and magnetic encoder feedback representing the angles of the wrist motors ) to the master i2c bus
            2.> Once connected, send data to the chip with an i2c writing function (probably from i2c-bus library) telling it to direct the desired motor's output channel to the i2c bus (see its data sheet on how to do this)
            3.> Do we need to tell the chip to start sending data? (See LTC2309's datasheet) [Answer: YES! use an i2c read function to read in all the data from the motors] In what format will the data be sent back to me, so as to know how to parse the data? (See the datasheets of the repsective actuators/motors)

            Diagram:
                            ,-> LTC2309 (base, shoulder, elbow & claw potentiometer analog voltage input)
                            |
                i2c master bus -> MPU6050(wrist accelerometer)
                            |
                            `-> AS5048A (wrist_l & wrist_r magnetic encoders)
                            |
                            `-> PCA9685 (i2c to PWM chip, Matt's class uses this; know pin numbers of your motors' control lines)

            LTC2309:
                Usage:
                    s1> Tell chip to switch channels (howto: datasheet p.10-16)
                    s2> Ask chip to give me the information from the motor/device connected to the current channel
                Notes:
                    1.> The chip has two internal registers, one for input (6-bit) from the i2c master, and the other for output (12-bit) to the i2c master
            MPU6050:
                Usage:
                    s1> Read x, y, and z data from the i2c chip

    Wrist Movement:
        1.> Should be fluid movement (i.e. both pitch and roll will happen at the same time)
            >> The way I wanna do it: if roll is requested, only one motor (depending on roll direction) will rotate until the roll angle is reached, and then at that point, both motors will rotate at the same speed and direction until the desired pitch is acheived, then a stop will occur
        2.> Angular data for each individual wrist motor will be taken from the magnetic encoders, and the wrist's overall pitch angle will be taken via an accelerometer (is this )
        3.> Experiment 2/15/16: To stop the wrist, from rotating the claw, a pwm value of 1488 (accounted for in the following conventions?)
            >PWM microsecond ranges: 1500 = stop, 1700 max (full speed in one direction), 1300 min (full speed in the other)
        >>>>Remove this bullet<<<<
        4.> As of 2/11/16:
            >> Khalil: Do not worry about the simultaneous motion, for now. We just need to get the arm (and wrist) moving for the video!

    Class Arm uses class PWM_Driver():
        Class usage explanation from Matthew Boyd as of 1/29/16:
            The class Arm will have its own class PWM_Driver(port,frequency) initialized within the file, with "port" = the i2c address of the adc device used to control the motors, and "frequency" = frequency of the signal that the pin will output. The class functions will be used to tell the motors to move a speed, to stop, and to change direction (using these functions to control the two H-Bridges attached to the i2c-to-pwm chip that class PWMDriver uses).

        setDuty(pin, duty) will be used to control the Linear Actuators since they use pwm duty cycles for control.
            Parameters:
                pin:
                    the pin number on the motor control adc that the desired motor is connected to
                duty:
                    the duty cycle percentage (0%-100%) that the pin should output (controls diff. things depending on context)
            Note:
                This function will be used to perform two tasks:
                    1.> LINEAR ACTUATOR SPEED CONTROL: used to connect to adc @ "i2c_port", and send the speed "duty" (an integer representing anywhere from 0% to 100%) to the linear actuator connected on pin "pwm_pin" on the adc.
                    2.> LINEAR ACTUATOR DIRECTION: used to connect to adc @ "i2c_port", and send the direction "duty" (an integer representing either 0% or 100% for extension/retraction, convention TBD) to the linear actuator connected on pin "pwm_pin" on the adc

        setMICRO(pin, micro) will be used to control the Servos.
            Parameters:
                pin:
                    the pin number (0-15) on the PCA9685 ADC to control
                micro: 
                    the amount of micro seconds the signal will be high for; this directly correlates to the speed of the servo rotation. The motor position will need to be checked to keep track of when to stop the motor, then the motor will be stopped using this function. Direction of continuous rotation servos will be doing by giving less than half way pwm signals for ccw, and more than half way pwm signals for cw

    Motor Count:
        By Arm Module:
            Arm:
                2x Linear Actuators (shoulder, elbow)
                1x Servo (base)
            End-Effector:
                2x Servos (Differential Gearbox (left and right servos))
                1x Servo (Claw)
        By Total Number:
            2x Linear Actuators
            4x Servos
        Links:
            Shoulder Linear Actuator: https://www.servocity.com/html/115_lbs__thrust__linear_actuat.html#.Vr2hhpM2uPR
            Elbow Linear Actuator: http://www.firgelli.com/Uploads/P16_DATASHEET_12JUN2015.pdf
            Wrist Servos(& Claw?): http://hitecrcd.com/products/servos/ultra-premium-digital-servos/hs-7950th-ultra-torque-hv-coreless-titanium-gear-servo/product
            Base Servo: https://www.servocity.com/html/hs-785hb_3_5_rotations.html#.Vr2Li5M2uPQ
            
        Servo Microsecond Mapping:
            HiTec HS-785HB (Base) Microsecond mapping:
                                       ^
                                       | middle
                                       |
                    90* ccw  <---------o---------> 90* cw

                1500us = middle;
                1430us = 90* ccw;
                1570us = 90* cw;
            HiTec HS-7950th (claw) Microsecond mapping:
                                       ^
                                       | middle
                                       |
                    90* ccw  <---------o---------> 90* cw

                ?us = middle;
                ?us = 90* ccw;
                ?us = 90* cw;

        Linear Actuator Digital to Angle Mapping (comes from drivers):
            Firgelli p16:

            ServoCity HD A4:


    Arm Angular Restrictions (information from John Han (Arm ME))
        - Arm will not go back on itself; its max will be ~180 degrees straight up in the air
