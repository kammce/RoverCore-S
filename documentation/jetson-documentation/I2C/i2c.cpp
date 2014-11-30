#include <errno.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdint.h>

int main(void) {
	int file;
	char filename[40];
	int addr = 0x0D; // The I2C address of the ADC

	sprintf(filename,"/dev/i2c-1");
	if ((file = open(filename,O_RDWR)) < 0) {
		printf("Failed to open the bus.");
		/* ERROR HANDLING; you can check errno to see what went wrong */
		exit(1);
	}

	if (ioctl(file,I2C_SLAVE,addr) < 0) {
		printf("Failed to acquire bus access and/or talk to slave.\n");
		/* ERROR HANDLING; you can check errno to see what went wrong */
		exit(1);
	}

	//Righting to SMBus I2C

	uint8_t reg = 0x00; /* Device register to access */
	uint16_t i = 0;
	char buf[10] = {0};
	buf[0] = reg;
	for(;i < 100; ++i) {
		buf[1] = i*2;
		buf[2] = 0;
		write(file, buf, 2);
		printf("Sending %x 0x%x\n", buf[0], buf[1]);
		usleep(500000);
	}
	return 0;
}
