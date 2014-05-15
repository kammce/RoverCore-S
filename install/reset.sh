#!/bin/bash

gpio="49"
if [ "$#" -ne 1 ] ; then
    echo "$0: exactly 2 arguments expected; "
    echo "$0 [ttyO2|ttyO4] [path/to/file.hex]"
    exit 3
fi

if [ "$1" != "/dev/ttyO2" -a "$1" != '/dev/ttyO4' ] ; then
    echo '$0: first argument must be string "ttyO2" or "ttyO4"'
    exit 1
else
    if [ "$1" = "/dev/ttyO2" ] ; then
        gpio="117"
    else
        gpio="49"
    fi
fi

echo "RESET GPIO: $gpio"
echo "HEX FILE: $2"

if [ -a "/sys/class/gpio/gpio$gpio" ]; then
	echo "/sys/class/gpio/gpio$gpio exists"
else
	echo "$gpio" > "/sys/class/gpio/export"
fi 
echo "out" > "/sys/class/gpio/gpio$gpio/direction"

echo 0 > "/sys/class/gpio/gpio$gpio/value"
sleep 0.9
echo 1 > "/sys/class/gpio/gpio$gpio/value" 
