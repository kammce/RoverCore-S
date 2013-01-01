#!/bin/bash

while true; do
	i2cdetect -y 3 &> /dev/null
done
