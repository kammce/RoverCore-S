#!/bin/bash
# Make sure only root can run our script
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

echo "Only install on Beagle Bone Black! (5 second halt)"
sleep 5s

echo "Compiling Device Tree Structure files (fireware)"

dtc -O dtb -o bone_pwm_P8_13_custom-00A0.dtbo -b 0 -@ bone_pwm_P8_13_custom-00A0.dts
dtc -O dtb -o bone_pwm_P8_19_custom-00A0.dtbo -b 0 -@ bone_pwm_P8_19_custom-00A0.dts
dtc -O dtb -o bone_pwm_P8_34_custom-00A0.dtbo -b 0 -@ bone_pwm_P8_34_custom-00A0.dts
dtc -O dtb -o bone_pwm_P8_36_custom-00A0.dtbo -b 0 -@ bone_pwm_P8_36_custom-00A0.dts
dtc -O dtb -o bone_pwm_P9_28_custom-00A0.dtbo -b 0 -@ bone_pwm_P9_28_custom-00A0.dts
dtc -O dtb -o bone_pwm_P9_29_custom-00A0.dtbo -b 0 -@ bone_pwm_P9_29_custom-00A0.dts

echo "Installing Compiled Firware into /lib/fireware"
cp bone_pwm_P8_13_custom-00A0.dtbo bone_pwm_P8_19_custom-00A0.dtbo bone_pwm_P8_34_custom-00A0.dtbo bone_pwm_P8_36_custom-00A0.dtbo bone_pwm_P9_28_custom-00A0.dtbo bone_pwm_P9_29_custom-00A0.dtbo /lib/firmware