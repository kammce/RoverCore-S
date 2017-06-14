#!/bin/bash

function SystemExit()
{
    echo "Exiting Script" 1>&2
    exit 1
}

# Make sure only non-root users can run our script
if [[ $EUID -eq 0 ]]; then
   echo -n "RoverCoreV2 installer script must NOT be run as root! " 1>&2
   echo -n "." 1>&2
   sleep 1
   echo -n "." 1>&2
   sleep 1
   echo -n "." 1>&2
   sleep 1
   echo " So try again!" 1>&2
   exit 1
fi

# Commented out because 2017 rover does not use the udev rules
# echo "Installing rover udev rules (video and bluetooth identifiers) into /etc/udev/rules.d"
# cp install/udev-rules/rover.rules /etc/udev/rules.d

echo "Need sudo privileges to run script."
sudo echo "" || SystemExit

echo -e "\nInstalling Build Essentials"
sudo apt-get install -y build-essential

echo -e "\nInstalling curl"
sudo apt-get install curl

# Adding Node Source Repository to Apt-Get
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -

echo -e "\nInstalling NodeJS"
sudo apt-get install -y nodejs

echo -e "\nInstall RoverCore NPM Dependencies"
npm install .
echo -e "\nNPM Install Grunt Command Line Interface"
sudo npm install -g grunt-cli
echo -e "\nNPM Install Mocha Command Line Interface"
sudo npm install -g mocha-cli
echo -e "\nNode Debug Inspector"
sudo npm install -g node-inspector

#echo -e "\nInstalling Lib udev development library"
#sudo apt-get install -y libudev-dev

#echo -e "\nInstalling BlueZ-tools"
#sudo apt-get install -y bluez-tools

# Kill sudo timestamp
sudo -k