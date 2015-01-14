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