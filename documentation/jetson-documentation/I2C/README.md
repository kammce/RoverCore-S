I2C
====

http://elinux.org/Jetson/I2C

Use I2C GEN2 on the pinout sheet of the Jetson. The I2C GEN2 is connected to adapter /dev/i2c-1.

Use:
	sudo i2cdetect -y -r 1

Any Addresses that pop up here are the devices you have connected up to this bus.

To write a byte (0x64) to interface i2c-1 (1), to that device at address (0xQQ, where QQ is the hex address of the device), to device register 0x00 (if talking to an arduino, this does not matter much)
use:
	sudo i2cset -y -r 1 0xQQ 0x00 0x64
