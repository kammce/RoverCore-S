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

    Wrist Movement:
        1.> Should be fluid movement (i.e. both pitch and roll will happen at the same time)
            >> The way I wanna do it: if roll is requested, only one motor (depending on roll direction) will rotate until the roll angle is reached, and then at that point, both motors will rotate at the same speed and direction until the desired pitch is acheived, then a stop will occur
        2.> Angular data for each individual wrist motor will be taken from the magnetic encoders, and the wrist's overall pitch angle will be taken via an accelerometer (is this )
        3.> Experiment 2/15/16: To stop the wrist, from rotating the claw, a pwm value of 1488 (accounted for in the following conventions?)
            >PWM microsecond ranges: 1500 = stop, 1700 max (full speed in one direction), 1300 min (full speed in the other)
        >>>>Remove this bullet<<<<
        4.> As of 2/11/16:
            >> Khalil: Do not worry about the simultaneous motion, for now. We just need to get the arm (and wrist) moving for the video!

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


    4/8/16=====================================================================================================================================
	New communication protocol between my Arm lobe (software in the ODROID) and Matt's software (library(?) that handles communication to the SAMD21
	(i.e. I create the control, Matt receives it, translates it into a desired command for action, then tells that command to the SAMD21)

	Guidelines
        a.> Data path:
                Control of the arm motors goes to Matt's software
                    - I will take interface input, translate that into appropriate control signals (pwm for servos, 1/0 for h-bridge control, etc.), and send them in a packet (which follows my and MATT's communication protocol) to Matt's software, which will then control the motors accordingly
                Current sensing feedback comes from Matt's software
                    - Matt will probably be sending me the current sensor feedback in a packet
                Positional Feedback
                    - Positional feedback for the shoulder DC motor will be received from the SAMD21. I'll have to use Serial communication to get that data (data comes from asking for it from matt's code)
                    - Positional feedback for the Firgelli will be taken from the SAMD21's internal ADC, so I'll have to use Serial communication to get that data
                    - Positional feedback for the wrist pitch/roll (MPU/MRE respectively) will be received from the SAMD21. The MRE and MPU shall be connected to the SAMD21, so I'll have to use Serial communication to get that data
		b.> All SAMD21 <-> Arm.js communication will be done through USB Serial (UART?)
