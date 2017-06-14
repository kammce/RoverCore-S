# RoverCore-S: The Mind of the Mars Rover

[![Documentation Status](https://readthedocs.org/projects/rovercore-s/badge/?version=latest)](http://rovercore-s.readthedocs.io/en/latest/?badge=latest)

[![Dependency Status](https://david-dm.org/kammce/RoverCore-S.svg)](https://david-dm.org/kammce/RoverCore-S.svg)

RoverCore-S is a framework written in node.js for organizing code written for robotics systems as well as setting up mechanisms for communicate between mission control and itself. RoverCore-S is modular and built to communicate between hardware peripherals (RoverCore-F) and a mission control interface (RoverCore-MC). The modules in RoverCore-S are called Lobes.

At the heart of RoverCore-S is the **Cortex.js** which does the following:

* Creates a bidirectional websockets server for mission control to connect to the Rover with.
* Can also act as a proxy server for which another instance of RoverCore-S and Mission control can communicate through. Mission control and the rover will connect to the IP address of the known proxy. Useful when the IP address of the rover is not known or directly accessible by mission control.
* Dynamically loads the modules *(Called Lobes)*.
* Handles activating Lobe HALT, RESUME or IDLE states. *(see Lobes States)*
* Handles incoming messages from Mission Control and either acts upon them (if directed at Cortex) or sends commands to the appropriate Lobes through their REACT function.
* Creates a utility structure which is given to each Lobe in their constructor to allow lobes to:
    * Store and Retrieve information from other lobes *(see Model.js)*
    * Communicate with mission control *(see feedback function in Cortex.js)*
    * Log information to STDOUT and to a log file *(see Log.js)*
    * Make UPCALLS to cortex to do global actions that effect the whole system or other lobes. *(see upcall function in Cortex.js)*

## Installation Instructions
### Node Tools
* `npm` - Package Manager
* `grunt` - Task Runner (to run unit tests and to lint)
* `mocha` - Unit Testing framework

### Node Development Dependencies *(see package.json)*
* `Chai` - TDD (Test Driven Design) Assertion Library
* `JSHint` - Javascript linting software
* `Sinon` - Stubs library


### Node Production Dependencies *(see package.json)*
* `primus` - Web sockets abstraction library
* `colors` - Terminal text coloring library
* `Forever Monitor` - Watch dog to keep RoverCore-S alive forever
* `i2c-bus` - library to interface with USERSPACE I2C device

### Prerequisites

Need to be running recent LTS (L.ong T.erm S.ervice) Ubuntu on your machine or install it on a virtual machine. The RoverCore-S code is meant to run on embedded Linux platform, thus development on a Linux machine will make translation easier.

## Installation
**Step 1:** Clone the repository (prefered method is to use the SSH git clone)

    git@bitbucket.org:sjsurobotics/rovercore-s.git

**Step 2:** change directories into **rovercore-s**

    cd rovercore-s

**Step 3:** Install  RoverCore-S using `install.sh` script. The script will install the latest `node.js@6.x.x`, `npm`,   node dependencies according to *package.json*. DO NOT INSTALL THE SCRIPT USING **SUDO**. The script will ask you for **sudo** permissions once it runs.

    ./install.sh

## **Running RoverCore-S**
*Use `sudo` if you are using I2C or Bluetooth or anything else that requires root permissions. *
To run RoverCore-S use the following command:

    [sudo] node RoverCore

To get more information about the command line arguments run:

    node RoverCore -h

##### RoverCore-S manual output:

NAME
    RoverCore - Start RoverCore

SYNOPSIS
    node RoverCore [-h]
    node RoverCore [-t http://address:port] [-s]

OPTIONS
    -h
        this parameter returns manual information

    -t, --target    http://address:port
        This parameter sets the address of the Primus.js server that
        RoverCore will communicate with.
        Defaults to http://localhost:9000.

    -s, --simulate
        This parameter will replace every module with empty version
        in the modules folder with a Protolobe module. The Protolobe
        will have the name and idle charateristics of the module it
        is replacing. This is useful for testing communication
        between interface and modules. Data sent to protolobe will
        be echoed back to the server and sent to stdout (console).

    -i, --isolate "module" | "module1,moduel2,..."
        Isolate a particular lobe. For a single module, you need
        only put in the name. List of lobes must be comma
        seperated list without spaces.

    --no-color
        Disable log coloring in RoverCore.

    -v, -vv, -vvv
        Verbose output.
        -v will show debug level 1 messages.
        -vv will show debug level 1 and 2 messages.
        -vvv will show debug levels 1, 2 and 3 messages.

## **Getting Started with RoverCore-S**
### **Lobes in RoverCore-S and What They Do**
The Lobes of RoverCore-S are modules that do work on the system. Lobes are structured classes that give mission control a means of controlling a specific system of the robot. Lobes can be used to retrieve and store sensor data, stream cameras, send an email, or literally do anything else that a Linux system running node.js can do.

### **How Lobes works**

#### Lobe States
Lobes have three states: **HALTED**, **RUNNING**, and **IDLING**. All of these states have a method associated with it. Each must be defined but does not necessary need to do anything. They can be empty methods and just return true.

#### react() method
When Cortex receives a command from mission control *targets* a specific Lobe, Cortex will call that lobe's *react()* method with the first parameter being the command sent from mission control. Thus the *react()* method is a means of handling commands sent from mission control to your lobe. Only one parameter is given to the react() method, but the command can be a mixed type (string, integer, structure, etc.). It is up to the lobe and mission control interface designer to decide how the commands will be represented.

#### HALTED state & halt() method
In the HALTED state, the lobe is stopped from doing any work and kept from reacting from mission control signals until RUNNING. Cortex will attempt to halt the a lobe in the following situations:
1. If the Mission Control controller of a lobe disconnects from the rover server or server proxy.
2. If the Mission Control controller sends a manual halt signal to Cortex to halt the lobe.
3. If another lobe uses an UPCALL to trigger the halt of a specific lobe or all lobes.

The *halt()* method within the lobe is the procedure that is run when Cortex attempts to halt the lobe. Return true if the halt was successful. Return false if the lobe did not halt successfully. Take care to use this area wisely. For systems like the arm or drive system, it may be very important to stop the actions of the arm or wheels when the module halts, so be sure to do so in these procedures. TRY NOT TO FAIL AT THIS!

#### RUNNING state & resume() method
In the RUNNING state, the lobe is active. The only way to exit a HALTED state is to run the *resume()* method. The resume method should do what ever is needed to bring the lobe out of the halted state.
1. If the Mission Control controller sends a manual resume signal to Cortex to resume a halted lobe.
2. If another lobe uses an UPCALL to trigger resume of a specific lobe or all lobes.

#### IDLING state & idle() method
Lobes are put into an IDLING state if they have not been sent a command from mission control in the specified amount defined in the *config.json* file. This is useful for lobes that need period commands from mission control. Lobes are put into IDLING state ~100ms after they are constructed.

Example: Take drive system which is always told in an instant which direction to go and at what speed. If there is an issue with the connection or the mission control interface such that there is a long and sustained delay between a full throttle command a stop command, then the system may be locked in a full speed mode and could injure someone or damage itself. After a period of time, Cortex will run the lobe's idle() routine which could be design to stop the motors.

#### How Mission Control to RoverCore-S Payload
*As of April 19th 2017, mission control no longer needs to assign connection to lobes. The halt-on-disconnect feature has been removed until a solution has been found.*

##### Payload Structure
```
{
    "target": "<Lobe|Cortex>",
    "command": { ... }
}
```
##### Payload Example
```
{
    "target": "DriveSystem",
    "command":
    {
        "speed": 20,
        "angle": 45
    }
}
```

#### Utility Classes
##### Neuron.js
Parent class of all Lobes that boostraps the halt, resume, idle and react methods.

##### Log.js
Abstraction library for printing out debug and log information to STDOUT and to file. Log will format the messages in the following way to make seeing the output of a particular lobe easier.

    [ < timestamp > ][ < Lobe Name > ] :: < output message >

Usage:

    this.log.output(msg_to_output, ...);
    this.log.output("HELLO WORLD", { foo: "bar" });

##### Model.js
Collection of all information stored on the rover by the lobes. Lobes can use the information stored in this structure to get information that other lobes have stored. For example, if the drive system lobe needed compass heading information and a compass lobe has already stored information there, then the following can happen:

```
#!javascript
//// Compass.js lobe
this.model.registerMemory("Compass");
this.model.set("Compass", {
    heading: 45 // in degrees
});

//// DriveSystem.js lobe
var compass = this.model.get("Compass");
if(compass["heading"] < SOME_VALUE) {
    DoAThing();
}
```

If a lobe would like to send such information to mission control, rather than using *feedback* it can be done through the model. Every time *this.model.set()* is used the information is automatically sent to mission control.

If you need to return the whole database of information one could use:
```
#!javascript
var memories = getMemory(0);
```

var memories will contain the whole structure of the model:
```
#!javascript
{
    "Compass": { heading: 45 },
    "DriveSystem":
    {
        speed: 20,
        angle: 45
    },
    ...
}
```

##### upcall() function
* Calling another module's REACT function
`this.upcall("CALL", "<target>", { /* command structure */ })`

* HALTALL, RESUMEALL or IDLEALL Modules
`this.upcall("HALTALL");`
`this.upcall("IDLEALL");`
`this.upcall("RESUMEALL");`

* Shutdown System (Computer)
`this.upcall("SYSTEM-SHUTDOWN");`

* Reboot System (Computer)
`this.upcall("SYSTEM-RESTART");`

* Restart-Cortex
`this.upcall("RESTART-CORTEX");`

##### feedback() function
*feedback()* will send information back to mission control from the lobe.
Usage:

    this.feedback(msg_to_output, ...);
    this.feedback("HELLO WORLD", { foo: "bar" });

### Creating a new Lobe

**Step 1:** Go into the modules folder and make a copy of the template folder **Protolobe**. Rename the copied folder to the name of the lobe you want to create. Naming convention for lobes is the same as Classes in the Java programming language:

* Use CamelCase (no spaces, dashes, or underscores)
* Cannot use special characters
* Must start with a letter

**Step 2:** Within your lobe folder, rename the **Protolobe.js** file to the name of your lobe folder.

**Step 3:** Change the name of the *Class* and the *module.export = ClassName* from Protolobe to the name of the folder. Should look like the following:

```
#!javascript
"use strict";

var Neuron = require('../Neuron');

class NewLobe extends Neuron // changed Protolobe to name of folder
{
    constructor(util)   { ... }
    react(input)        { ... }
    halt()              { ... }
    resume()            { ... }
    idle()              { ... }
}

module.exports = NewLobe; // changed Protolobe to name of folder
```

**Step 4:** Updating the constructor method.
```
//// Set lobe color by changing this line
this.log.setColor("red");
// time in milliseconds before idle timeout
this.idle_timeout = 2000;
```
The list of text colors can be found here https://www.npmjs.com/package/colors.
##### Utilities Structure
Each lobe is given a utilities structure by Cortex through their constructor method. The structure is as follows:
```
#!javascript
{
    "name":
    "log":
    "model":
    "upcall":
    "extended":
    "feedback":
}
```

* **name**: The name of the module using the module's folder name
* **log**: holds the log object reference
* **model**: holds the model object reference
* **upcall**: holds the Cortex upcall function reference
* **extended**: holds the structure of the extended utilities
* **feedback**: holds the feedback function reference

## Unit Testing
### Purpose
When designing software for mission critical system, the software must be fast, efficient, fail-safe, and without bugs and errors. To do this, one could manually check every single function but this raises the issue of the check not being through enough to check every single case and edge case. These mistakes accumulate and the end result is a system with various internal bugs that result in misbehavior. This could lead to a failure during a mission critical task rendering the system disabled or behaving in such a way that could jeopardize the mission, damage itself, or damage things around it.

The solution is T.est D.riven D.esign (TDD), which is a methodology of creating tests for your code. When you have a suite of tests that do the work of testing your code for you, the tests will test the code the same way each time and will never miss a step. The tests never get sleepy, drunk, hungry, or sick and they will do all the work of testing your code to confirm that it is behaving properly. Their existence also allows the developer to determine when a change in the design somewhere else breaks a feature in another location. Making a test is the best way to test out a utility class or a lobe without having to use RoverCore.

There are four types of test we will use for this project:

1. Unit
2. Integration
3. End-to-End
4. Mission Control

End-to-End and Mission Control testing are the two that must be done manually. The developer must manually verify that the system is working as intended. These are the tests most developers are used to. The End-to-End test is a test of the whole module from mission control to RoverCore-S to the board to the mechanical interface. Mission control tests are unified tests that takes the entire system as a whole together during operations.

### Approach & Methodology
Our approach to TDD is the following:

1. Create a class design document with the following:
    1. Design Requirements/Specification
    2. System Diagram
    3. Functional Class Description
    4. Class Testing Scheme
    * Design document shall be verified by the control systems lead before preceding.
2. Create unit test code
    1. Use class design document to generate your unit tests (there should not be any thinking about what/how you will test the function but how you will make code to test it).
    2. Code to be tested should be an empty Protolobe class. DO NOT WRITE ANY CODE YET!
    2. Run unit tests.
    3. All unit tests must fail.
        * Since your test is testing code that does not exist, it should be impossible for your code to pass. Unless your test is also wrong. If any of your unit tests do not fail, check your logic for why it passed without
    4. The tests that have failed are a list of goals that your code needs to pass.
3. Write code
    * You should not have to think about how you should write code, let the tests guide how you will code.
    * Focus on one test at a time. Start with the test that does not require any other code to work.
    * Once the code written completes all of it's tests you are done coding. If your code need additional functionality, then it needs to be added to your doc, then a unit test to test it, and then you can write it.
4. End-To-End Testing
    * Test your code on the Odroid XU3/4 with a connection to Mission control, the electrical board and the mechanical system.
    * If your codes does not require testing from one or more of the above teams, then ignore it.

### Running Unit Tests
For RoverCore-S, we use the *Mocha* testing framework and the *Chai* assertion library. To make sure your code is written properly to a standard, *JSHint* is used. To run everything we use *Grunt*.

#### Installing Global Frameworks and CLIs

You will need to install _Mocha_ and _Grunt_ globally.

    npm install -g mocha
    npm install -g grunt-cli

#### Running Tests

To run the whole system's worth of unit tests run the following command with the *--force* argument (force tells grunt to continue through every task even if one of them fails).

    [sudo] grunt --force

To run the unit test make sure you are at the *root* of the repo and run the following:

    mocha --require test-suite/assist/config_chai.js test-suite/unit/<unit test folder>/<unit test file>.js

### Example Unit Tests
Example unit tests can found in the **test-suite/unit/cortex/** folder.

## Deployment
To deploy RoverCore-S, use the instructions in

### Optimize Embedded Linux Platform by
* Disabling the GUI (Xorg, lightdm etc)
* Disabling HDMI and other video output sources
* Using eMMC memory rather than SD card. eMMC is faster.
* Pushing video transcoding off to a server if possible. Try not to do not do video processing on system unless it has the resources to handle it.
* Refraining from using OpenCV on Robot platform. OpenCV is a prototyping tool used to and should not be used in competition.

## Versioning
[IN PROGRESS]

## Authors
*Khalil A. Estell* - Creator and maintainer

## License
Code is currently propriety to and is copyright under *Khalil A. Estell*.

## Acknowledgments
*Matthew Boyd* - Control Systems lead since 2014
*Mitch Waldman* - Control Systems member in the 2014-2015 competition and gave feedback on how to improve RoverCore.
*Henry Tran* - Mission Control lead for 2015-2016 competition and gave feedback on how to improve RoverCore.
*Alyssa Sandore* - Mission Control lead for 2016-2017 competition and gave feedback on how to improve RoverCore along with its connection with mission control.