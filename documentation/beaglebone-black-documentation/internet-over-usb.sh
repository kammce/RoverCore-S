#!/bin/bash
# Run this as root!

iptables --table nat --append POSTROUTING --out-interface eth0 -j MASQUERADE
iptables --append FORWARD --in-interface eth2 -j ACCEPT



