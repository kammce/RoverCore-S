RoverCore Software from SJSU Robotics
===

### To build application:

Prerequisites (Unix only):
    * GCC 4.2 or newer
    * G++ 4.2 or newer
    * Python 2.6 or 2.7
    * GNU Make 3.81 or newer
    * Latest NodeJS from Joyent repo

Run: 
```npm install
to install the necessary dependancies for the application.

**May 13 2015**
* Merging everyone's code into master!!!

**Mar 13 2015**

* Seperated the video module from cortex and created OCULUS
* Oculus has not been fully tested
* Cortex now has a simulation mode for working on telecommunications (soon will add the ability to isolate individual models and work on them)
* MindController now sends sensor information to Mainframe to be sent to all of Mission Control
* Added in the beginnings of Production mode 
* MindController now halts individual modules based on who is logged in
* Cortex will not make global instances of the spine, i2c and serialport until used on the beaglebone black.


**Jan 8 2015**

* Cortex now must be supplied with the server to connect to
* Cortex now creates a global variable called address that can be used anywhere in the code to reference the server that the rover is connected to.
* Fixed some minor issues with video.
* Added feature to framework that allows modules to send feedback to mission control. 
	* The function is called feedback and every module is delivered a reference to that 
	* function on construction.
* Made progress on the video feedback module. It currently can be used to send a 
	single camera feed to the server. One can also tell the module to switch 
	between feeds. Defaults to off, only works on linux.
