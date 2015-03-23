#!/bin/bash

# Make sure only root can run our script
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi
wget -q --tries=10 --timeout=20 --spider http://google.com
if [[ $? -eq 0 ]]; then
    echo "Device is online!"
else
	echo "Script cannot complete, beaglebone is currently offline."
	exit 1
fi

# Setting date to the current internet time to get 
ntpdate pool.ntp.org
# Update Core Operating System
apt-get update 
apt-get -y upgrade
apt-get -y dist-upgrade
# Installing latest nodejs
apt-get install -y nodejs npm
# Running firware installation
cd firmware
./firmware-install.sh
# Leaving firmware directory and going to root
cd ../..
# Installing dependencies
npm install