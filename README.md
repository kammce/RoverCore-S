# **RoverCoreV2: The Mind of the Mars Rover**
-----
RoverCore is meant to run on an embedded Linux platform such as Odroid, BeagleBone, and Raspberry Pi . 

# **Development Libraries and Tools**
-----
* npm               - Package Manager
* primus            - Web sockets abstraction library 
* i2c-bus           - Abstraction layer for the linux I2C driver
* Color             - Terminal text coloring library
* Colorspace        - Terminal text coloring library
* Forever Monitor   - Watch dog to keep RoverCore alive forever
* Mocha             - Unit Testing framework
* Chai              - TDD (Test Driven Design) Assertion Library
* JSHint            - Javascript linting software
* Grunt             - Task Runner (for unit testing, linting)

# **Installation Instructions**
-----
The RoverCore code is meant to run on embedded linux platform, thus running a linux machine will make translation easier.
#### First time installation instructions on personal machine:
This will install the development libraries which allow Mocha, Chai, Grunt etc to run on your host machine.

    npm install

To run RoverCore

    node RoverCore.js 

To run a local dummy server

    node server-integration-test.js

When you run *node RoverCore.js -h*

    NAME
       RoverCore.js - Start RoverCore

    SYNOPSIS
       node RoverCore.js [-h]
       node RoverCore.js [-t http://address:port] [-s]

    OPTIONS
       -h 
              this parameter returns manual information 

       -t, --target     http://address:port
              This parameter sets the address of the Primus.js server that 
              RoverCore will communicate with.
              Defaults to http://localhost:9000.

       -s, --simulate
              This parameter will replace empty version of every module 
              in the modules folder with a Protolobe module. The Protolobe 
              will have the name and idle charateristics of the module it 
              is replacing. This is useful for testing communication 
              between interface and modules. Data sent to protolobe will 
              be echoed back to the server and sent to stdout (console).

       -i, --isolate "module" | "module1,moduel2,..."
              Isolate a particular lobe. For a single module, you need 
              only put in the name. List of lobes must be comma 
              seperated list without spaces. 
       -p, --i2cport "<port number>"
              Select the I2C port that the device will use. If -1 is used, 
              the I2C library will be replaced with an empty function This
              will cause the modules that use them to fail at load.
              Defaults to 1

#### Installation instructions for Odroid, BeagleBone, RaspPi etc:
Install dependencies without development libraries

    npm install --production

Run RoverCore
    node RoverCore.js

#### How to Optimize Embedded Linux:
* Disable GUI (Xorg, lightdm etc)
* Disable HDMI output 
* Use eMMC memory rather than SD card. eMMC is faster.
* Do not process video stream
* Do not do image or object recognition on Rover (unless a task is autonomous) 

# **Git Workflow**
-----
When working on a part of the project make sure to:

- ALWAYS create an ISSUE with the appropriate tag and add any relevant people as watchers. 
- ALWAYS work on a different local branch, DO NOT push any changes directly to master. Branch naming convention <handle>/<objective> ex. kammce/i2c-network.
- ALWAYS create pull requests (PR) with an ISSUE attached to the PR.
- DO NOT create a PR if your module does not pass its tests.
- DO NOT create a PR if your module does not pass its the JSHint linting process. 
- ALWAYS squash commits before merging to MASTER. This will allow us to manage commits better on MASTER.
- ALWAYS merge the latest MASTER into your branch creating a PR for MASTER. You can use the bitbucket branch sync button as well.
- ALWAYS merge the latest MASTER into your branch before working on branch. You can use the bitbucket branch sync button as well.
- ALWAYS get approval from at least one person before merging into MASTER.

Following these guidelines will allow us to catch merge conflicts and reduce the amount of work we do when trying to resolve errors when merging into MASTER.

# **Unit Testing**
-----
## Purpose
When designing software for mission critical system, the software must be fast, efficient, fail-safe, and without bugs and errors. To do this, one could manually check every single function but this raises the issue of the check not being through enough to check every single case and edge case. These mistakes accumulate and the end result is a system with various internal bugs that result in misbehavior. This could lead to a failure during a mission critical task rendering the system disabled or behaving in such a way that could jeopardize the mission, damage itself, or damage things around it.

The solution is T.est D.riven D.esign (TDD), which is a methodology of creating tests for your code. When you have a suite of tests that do the work of testing your code for you, the tests will test the code the same way each time and will never miss a step. The tests never get sleepy, drunk, hungry, or sick and they will do all the work of testing your code to confirm that it is behaving properly. Their existence also allows the developer to determine when a change in the design somewhere else breaks a feature in another location.

There are four types of test we will use for this project:

1. Unit
2. Integration
3. End-to-End
4. Mission Control

End-to-End and Mission Control testing are the two that must be done manually. The developer must manually verify that the system is working as intended. These are the tests most developers are used to. The End-to-End test is a test of the whole module from mission control to RoverCore to the board to the mechanical interface. Mission control tests are unified tests that takes the entire system as a whole together during operations.

## Approach & Methodology
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

## Running Unit Tests
For RoverCore, we use the *Mocha* testing framework and the *Chai* assertion library. To make sure your code is written properly to a standard, *JSHint* is used. To run everything we use *Grunt*.

**Installing Global Frameworks and CLIs**

You will need to install _Mocha_ and _Grunt_ globally.

    npm install -g mocha
    npm install -g grunt-cli

**Running Tests**

To run the whole system's worth of unit tests run the following command with the *--force* argument (force tells grunt to continue through every task even if one of them fails).

    grunt --force

To run the unit test make sure you are at the *root* of the repo and run the following:
    
    mocha --require test-suite/assist/config_chai.js test-suite/unit/<unit test folder>/<unit test file>.js 

## Example Unit Tests
Example unit tests can found in the **test-suite/unit/cortex/** folder.