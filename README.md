# RoverCore-S: The Mind of the Mars Rover

[![RoverCore-S Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/kammce/RoverCore-S/)
[![Documentation Status](https://readthedocs.org/projects/rovercore-s/badge/?version=latest)](http://rovercore-s.readthedocs.io/en/latest/?badge=latest)
[![Dependency Status](https://david-dm.org/kammce/RoverCore-S.svg)](https://david-dm.org/kammce/RoverCore-S)
[![Development Tools Dependency Status](https://david-dm.org/kammce/RoverCore-S/dev-status.svg)](https://david-dm.org/kammce/RoverCore-S?type=dev)
[![Build Status](https://travis-ci.org/kammce/RoverCore-S.svg?branch=master)](https://travis-ci.org/kammce/RoverCore-S)
[![Code Coverage by codecov](https://codecov.io/gh/kammce/RoverCore-S/branch/docs/graph/badge.svg)](https://codecov.io/gh/kammce/RoverCore-S)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b96745c6fe2f4a638bf67d22a4cdf72e)](https://www.codacy.com/app/kammce/RoverCore-S?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=kammce/RoverCore-S&amp;utm_campaign=Badge_Grade)

RoverCore-S is a framework written in node.js for organizing code written for robotics systems as well as setting up mechanisms for communicate between mission control and itself. RoverCore-S is modular and built to communicate between hardware peripherals (RoverCore-F) and a mission control interface (RoverCore-MC). The modules in RoverCore-S are called Lobes.

See **[documentation](http://rovercore-s.readthedocs.io/en/latest/?badge=latest)** for a full tutorial and details.

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

### Prerequisites

RoverCore was built to run on Ubuntu and on Embedded Linux Platforms. Your best option is to run the most recent LTS (L.ong T.erm S.ervice) Ubuntu on your machine or install it on a virtual machine.

## Installation
**Step 1:** Clone the repository (prefered method is to use the SSH git clone)

    git clone https://github.com/kammce/RoverCore-S.git

**Step 2:** change directories into **rovercore-s**

    cd RoverCore-S

**Step 3:** Install RoverCore-S using install.sh script. The script will install the latest node.js@6.x.x, npm, node dependencies and development tools according to package.json.

    ./install.sh

## **Running RoverCore-S**
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

## Versions
0.0.1

## Authors
*Khalil A. Estell* - Creator and maintainer

## License
The code is copyright under *Khalil A. Estell* under the Apache 2.0 license. See LICENSE file in repository.

## Acknowledgments
* *Matthew Boyd* - Control Systems lead since 2014
* *Mitch Waldman* - Control Systems member in the 2014-2015 competition and gave feedback on how to improve RoverCore.
* *Henry Tran* - Mission Control lead for 2015-2016 competition and gave feedback on how to improve RoverCore.