#!/bin/bash

# Not done yet!
# Come back soon

# Do this after flashing the jetson to get software and libraries up to date

# TODO: check if jetson is online. Quit if offline

# Add Universe and Multiverse Repositories

# Update 
sudo apt-get update 
sudo apt-get -y upgrade
sudo apt-get -y dist-upgrade
# Install the following tools
sudo apt-get install -y build-essential libssl-dev
sudo apt-get install -y i2c-tools nodejs npm
