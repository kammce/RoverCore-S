How to send to Arm Motor via UART: Use the node serialport library (from voodootikigod)
	~	RoverCore syntax:
			var Name_of_SerialPort_Obj = new SerialPort("path/to/uart/device", { baudrate: 57600 });
	~	General syntax:
			var Name_of_require_obj = require('serialport').SerialPort;
			var Name_of_SerialPort_Obj = new Name_of_require_obj("path/to/uart/device", { misc_options }); //misc_options are optional
	~	Path: ttyO1, ttyO2, ttyO4, ttyO5 are available. choose 1 (will be formatted like /dev/ttyO1, the O is an 'Oh', not a 0 'zero')
	~	Baudrate: motor accepts 8000 bps(baud) - 3 Mbps, but with experimentation, RX-64AR only works well with 57600
		>	Default Baudrate of Servo: 9600 bps(baud), unless otherwise specified
	~	For robotic arm, we'll probably have all motors except the base motor be in joint-mode, because they are joints, not meant to 		rotate at an unlimited angle
For more detailed info on formatting and usage of SerialPort Library ---> See https://github.com/voodootikigod/node-serialport/blob/master/README.md
	~	See http://support.robotis.com/en/techsupport_eng.htm#software/dynamixelsdk.htm to figure out how to format read/write commands	
		>	You can practice using the MX-64 data signal format with an arduino

Motors in the arm: 5 total. 1 for base, 2 for shoulder connecting upper arm to base, 1 on elbow, and 1 for the claw's wrist.
	~	Expected input command format from mission-control-test.html:
		{ 
		  "base": 0,        //<---All paramters other than speed are positional parameters in 0-360 degrees. Speed is in rpm
		  "shoulderL": 0,
		  "shoulderR": 0,
		  "elbow": 0,
		  "wrist": 0,
		  "speed": 0	//<---Expects rpm val of range 0.114rpm to ~117.07rpm (1 - 1023, aka 0x0 - 0x3FF joint mode). 0x00 uses max speed.
		}

Decided IDs for the different motors:
	~Base - 0x00
	~ShoulderL - 0x01
	~ShoulderR - 0x02
	~Elbow - 0x03
	~Wrist - 0x04


**Joint-Mode:
	All motors, except for the base, should act as joints in an arm, and thus not be able to rotate infinitely. That means that all but the Base motor should be in "JOINT-MODE" which is acheived by setting non-zero minimum/maximum limits to the angular positions of the motors. This is done by assigning those non-zero values to CW(Address 0x06) and CCW(Address 0x08), respectively as min and max.

**Setup Note:
	The Dynamixels won't initially be set to these respective IDs, so you'll have to connect to each one manually to set them to these values!!

**Packet Formatting Note:
	In Lowest and Highest Byte systems (see http://support.robotis.com/en/techsupport_eng.htm#software/dynamixelsdk.htm, example 10),
after the control table write adress (the parameter you are writing to) the next byte is the lowest byte (in the ex., 0x00), and the one
after that is the highest byte (in the ex., 0x02), and in the ex, it adds up right to left as 02 (higher byte) & 00 (lower byte) turning
into 0x0200, which is the 150* the example was referring to.
