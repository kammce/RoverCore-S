"use strict";

const Lidar_Address             = 0x62;
//const Lidar_Control             = 0x00;
const Lidar_Status              = 0x01;
//const Lidar_Velocity            = 0x09;
const Lidar_Distance_HighByte_Register   = 0x0f;
const Lidar_Distance_LowByte_Register   = 0x10;
const Lidar_Distance_HighByte = 0x01;
const Lidar_Distance_LowByte = 0x0f;
class I2CTest
{
		constructor(){
			
		}
		writeByteSync(){

		}
		readByteSync(addr, reg){
			if(addr === Lidar_Address){
				if(reg === Lidar_Distance_LowByte_Register) {
					return Lidar_Distance_LowByte;
				} else if(reg === Lidar_Distance_HighByte_Register) {
					return Lidar_Distance_HighByte;
				} else if(reg === Lidar_Status) {
					return 0x01;
				}
			}
		}
	}

module.exports = I2CTest;