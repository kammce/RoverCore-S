#!/bin/bash
# Make sure only root can run our script
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

echo "Installing rover video identifiers into /etc/udev/rules.d"
cp rover.rules /etc/udev/rules.d