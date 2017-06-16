***************
About
***************

RoverCore-S is a framework written in node.js for organizing code written for robotics systems as well as setting up mechanisms for communicate between mission control and itself. RoverCore-S is modular and built to communicate between hardware peripherals (RoverCore-F) and a mission control interface (RoverCore-MC). The modules in RoverCore-S are called Lobes.

At the heart of RoverCore-S is the Cortex.js which does the following:

* Creates a bidirectional websockets server for mission control to connect to the Rover with.
* Can also act as a proxy server for which another instance of RoverCore-S and Mission control can communicate through. Mission control and the rover will connect to the IP address of the known proxy. Useful when the IP address of the rover is not known or directly accessible by mission control.
* Dynamically loads the modules (Called Lobes).
* Handles activating Lobe HALT, RESUME or IDLE states. (see Lobes States)
* Handles incoming messages from Mission Control and either acts upon them (if directed at Cortex) or sends commands to the appropriate Lobes through their REACT function.
* Creates a utility structure which is given to each Lobe in their constructor to allow lobes to:
* Store and Retrieve information from other lobes (see Model.js)
* Communicate with mission control (see feedback function in Cortex.js)
* Log information to STDOUT and to a log file (see Log.js)
* Make UPCALLS to cortex to do global actions that effect the whole system or other lobes. (see upcall function in Cortex.js)