=================
Arm System README
=================

Description:
    The input is to be a JSON object with the following definition:
        var Arm_Object = {
            system: [String],
            val: [Object]
        }

Format Synopsis:
    1.> Arm Movement
    {
        "system": "arm",
        "val":  {
                    "base": [int],          //  desired angle of base (angle limits TBD)
                    "shoulder": [int],      //  desired angle of shoulder (angle limits TBD)
                    "elbow": [int],         //  desired angle of elbow (angle limits TBD)
                    "wrist": [int]          //  desired angle of wrist (angle limits TBD)
                }
    }
    2.> Tool Manipulation
    {
        "system": "tool",
        "val":  {
                    "command": [string],    //  choose "switch", "operate", or "draw"
                    "param": [int]          
                }
    }

Notes:
    Using I2C to interact with the motors (using chip designed by Sean Setterfield (Arm EE)):
        Getting input/sending output to the arm motors will be done via i2c. One need only send the pin num of the output channel to a "sender" chip (will have a certain i2c address) that is connected to the desired motor, and you can read output data by receiving input from a "receiver" chip (an analog-to-digital converter (ADC), will have a certain i2c address) which should output its data from the corresponding pin number (as was done with sending data).

    Motor Count
        Arm: 2x Linear Actuators (shoulder, elbow), 1x Servo (base)
        End-Effector: 2x Servos (Khalil's Wrist joint designe (left and right servo)), ?x Servo (Brian's Claw??)

    Arm Angular Restrictions (information from John Han (Arm ME))
        - Arm will not go back on itself; its max will be ~180 degrees straight up in the air

    Syntax Descriptions
        1.> (String) system
            "The string representing the name of the system you wish to control"
                Choose from one of the following options:
                "arm": Specifies a movement command
                "tool": Specifies an end-effector tool command
                "power": Specifies an Arm power on/off command (Q: Is this needed?)
        2.> (Object) val
            "The object containing the parameters for the system specified"
                Required object members vary depending on the system, see below:
                a.> members for system "arm"
                        (int) base: Specifies the desired angle of the base
                        (int) shoulder: Specifies the desired angle of the shoulder
                        (int) elbow: Specifies the desired angle of the elbow
                        (int) wrist: Specifies the desired angle of the wrist
                b.> members for system "tool"
                        (string) "command":
                            Choose one from the following:
                                "switch": Specifies a tool switch command
                                "operate": Specifies a tool operation command (Q: will this vary by tool?)
                                "draw": Specifies a draw/holster (tool retraction to endeffector) operation command
                        (int) "param":
                            An integer within a range that varies by "command" (see below)
                                command "switch": 0-? = tool number (index on cnc rack)
                                command "operate": 0 = off, 1 = on
                                command "draw": 0 = holster, 1 = draw