=================
Arm System README - Branch Arm added 2/5/16
=================

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
    Using I2C to interact with the motors (using chip designed by Sean Setterfield (Arm EE)):
        Getting input/sending output to the arm motors will be done via i2c. One need only send the pin num of the output channel to a "sender" chip (will have a certain i2c address) that is connected to the desired motor, and you can read output data by receiving input from a "receiver" chip (an analog-to-digital converter (ADC), will have a certain i2c address) which should output its data from the corresponding pin number (as was done with sending data).

    Class Arm uses class PWM_Driver():
        Class usage explanation from Matthew Boyd as of 1/29/16:
            The class Arm will have its own class PWM_Driver(port,frequency) initialized within the file, with "port" = the i2c address of the adc device used to control the motors, and "frequency" = frequency of the signal that the pin will output

        setDuty(i2c_port, pwm_pin, duty) will be used to control the Linear Actuators since they use pwm duty cycles for control.
            Parameters:
                i2c_port:
                    the i2c address of the motor control adc in the i2c network
                pwm_pin:
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
                    the amount of micro seconds the signal will be high for; this directly correlates to the speed of the servo rotation. The motor position will need to be checked to keep track of when to stop the motor, then the motor will be stopped using this function

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

    Arm Angular Restrictions (information from John Han (Arm ME))
        - Arm will not go back on itself; its max will be ~180 degrees straight up in the air
