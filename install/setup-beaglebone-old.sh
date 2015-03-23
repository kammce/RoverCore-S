#!/bin/bash

# Make sure only root can run our script
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Update Core Operating System
apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade

# Install latest nodejs (incomplete)
apt-get install -y nodejs npm

# Install auto wifi or auto mifi (untested)
apt-get install -y wpa_supplicant
## Install WPA Supplicant configuration files
mv /etc/wpa_supplicant/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf.backup
cp rover-files/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf
## Install network interface files
mv /etc/network/interfaces /etc/network/interfaces.backup
mv rover-files/interfaces /etc/network/interfaces
## Change RC-Local to force auto wpa and wlan acceptance
mv /etc/rc.local /etc/rc.local.backup
mv rover-files/rc.local /etc/rc.local

# Setup nodejs autostart

