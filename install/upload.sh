#!/bin/bash
gpio="49"
if [ "$#" -ne 2 ] ; then
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

if [ "$2" -f ]; then
    echo "Second argument must be a .hex file"
    exit 0
fi

echo "LOADING DEVICE: $1"
echo "RESET GPIO: $gpio"
echo "HEX FILE: $2"

echo "$gpio" > "/sys/class/gpio/export"
echo "out" > "/sys/class/gpio/gpio$gpio/direction"

(echo 0 > "/sys/class/gpio/gpio$gpio/value" && sleep 0.9 && echo 1 > "/sys/class/gpio/gpio$gpio/value") & 
avrdude -v -carduino -patmega328p -P$1 -b57600 -D -Uflash:w:$2 2>&1
