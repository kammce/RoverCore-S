RoverCoreV2: The Mind of the Mars Rover
===================
RoverCore is meant to run on an embedded Linux platform such as Odroid, BeagleBone, and Raspberry Pi . 

# **Development Libraries and Tools**
-----
* npm				- Package Manager
* primus			- Web sockets abstraction library 
* i2c-bus       	- Abstraction layer for the linux I2C driver
* Color 			- Terminal text coloring library
* Colorspace 		- Terminal text coloring library
* Forever Monitor	- Watch dog to keep RoverCore alive forever
* Mocha				- Unit Testing framework
* Chai				- TDD (Test Driven Design) Assertion Library
* JSHint			- Javascript linting software
* Grunt				- Task Runner (for unit testing, linting)

## **Installation Instructions**
The RoverCore code is meant to run on embedded linux, thus running a linux machine will make translation easier.
#### First time installation instructions on personal machine:

	$ npm install
This will install the development libraries which allow Mocha, Chai, Grunt etc to run on your host machine.
#### Use Instructions:
Run local dummy server

	$ node Server.js

Run RoverCore

	$ node RoverCore.js

#### First time installation instructions on Odroid, BeagleBone, RaspPi etc:
Install dependencies without development libraries

	$ npm install --production
Run RoverCore
#### Use Instructions:

	$ node RoverCore.js

#### Optimize Odroid:
* Disable GUI (Xorg, lightdm etc) and HDMI output 

# **Git Workflow**
-----
When working on a part of the project make sure to:

- ALWAYS create an ISSUE with the appropriate tag and add any relevant people as watchers. 
- ALWAYS work on a different local branch, DO NOT push any changes directly to master. Branch naming convention <handle>/<objective> ex. kammce/i2c-network.
- ALWAYS create pull requests (PR) with an ISSUE attached to the PR.
- DO NOT create a PR if your module does not pass its Unit Tests.
- DO NOT create a PR if your module does not pass its the JSHint linting process. 
- ALWAYS squash commits before merging to MASTER. This will allow us to manage commits better on MASTER.
- ALWAYS rebase from latest MASTER before merging to MASTER.
- ALWAYS rebase from latest MASTER before working on branch.
- ALWAYS get approval from at least one person before merging into MASTER.

Following these guidelines will allow us to catch merge conflicts and reduce the amount of work we do when trying to resolve errors within MASTER.

# **Unit Testing**
-----
## Purpose
In order to design efficent and 

## Methodology

## Instructions + Grunt
	$ node RoverCore.js