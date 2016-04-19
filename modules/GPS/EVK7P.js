"use strict";

class EVK7P {
	constructor (log) {//not sure if log is needed
		this.data = "";           //raw serial port data
		this.nmeaType = "";       //looking for $GPRMC
		this.utc = "";            //time in UTC
		this.fix = "";            //A or V, A=good, V=void
		this.lat = "";            // -90<=x<=90
		this.latDir = "";         // N or S
		this.long = "";           // -180<=x<=180
		this.longDir = "";        // E or W

		//may not use:
		this.speedKnots = "";     // 
		this.heading = "";        // 
		this.dateStamp = "";      // 
		this.variation = "";      // 
		this.varitationDir = "";  // 
		this.validData = "";      //0 or 1; 0=invalid, 1=valid
	}
	


	showPortOpen() {  
    //function displays that port has connected, and displays data rate of port 

	}
	showPortClose() {  
    //function alerts that port has been closed

	}
	checkValid(nmeaType,fix,lat,long) {  
    //function checks if the nmea sentence is GPRMC, 
    //whether the fix is valid, and that the location 
    //is not origin (0 lat, 0 long). If any tests 
    //return false, this sentence is not used.

	}
	parseNMEA(data) {  
    //@function takes serial data and splits by 
    //comma-delimiters (nmeaType, utc, fix, lat, 
    //latDir, long, longDir, speedKnots, heading, 
    //dateStamp, variation, varitationDir, checksum).
	}
	showError() {  
    //@function displays serialport errors

	}
	checkPort() {  
    //@function checks if port is open, and checks for any serial input

	}
	Log(long,longDir,lat,latDir) {     //log data measured by chip
        //console.log(data);
        console.log("Longitude: ${this.long} ${this.longDir} Latitude: ${this.lat} ${this.latDir}");
    }

}

module.exports = EVK7P;