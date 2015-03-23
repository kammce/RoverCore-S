#!/bin/bash
# Make sure only root can run our script
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

echo "Only install on Beagle Bone Black! (5 second halt)"
sleep 5s

echo "Compiling Device Tree Structure files (fireware)"
dtc -O dtb -o BONE_PWM_A-00A0.dtbo -b 0 -@ BONE_PWM_A-00A0.dts 
dtc -O dtb -o BONE_PWM_B-00A0.dtbo -b 0 -@ BONE_PWM_B-00A0.dts 
dtc -O dtb -o BONE_PWM_C-00A0.dtbo -b 0 -@ BONE_PWM_C-00A0.dts 
dtc -O dtb -o BONE_PWM_D-00A0.dtbo -b 0 -@ BONE_PWM_D-00A0.dts 
dtc -O dtb -o BONE_PWM_E-00A0.dtbo -b 0 -@ BONE_PWM_E-00A0.dts 
dtc -O dtb -o BONE_PWM_F-00A0.dtbo -b 0 -@ BONE_PWM_F-00A0.dts 


echo "Installing Compiled Firware into /lib/fireware"
cp BONE_PWM_A-00A0.dtbo BONE_PWM_B-00A0.dtbo \
BONE_PWM_C-00A0.dtbo BONE_PWM_D-00A0.dtbo \ 
BONE_PWM_E-00A0.dtbo BONE_PWM_F-00A0.dtbo \
 /lib/firmware