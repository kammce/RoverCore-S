//
//
//
"use strict";

class MPU6050{
    constructor(SA, i2c, log) {
        //need this because i2c is created in rovercore
        this.SA = SA;
        this.i2c = i2c;
        this.log = log;

        this.inputs = [];

        this.xposL = "";
        this.yposH = "";
        this.xposH = "";
        this.yposL = "";
        this.zposH = "";
        this.zposL = "";
        this.tempH = "";
        this.tempL = "";
        this.xpos = "";
        this.ypos = "";
        this.zpos = "";
        this.temp = "";

        this.xmagnL = "";
        this.xmagnH = "";
        this.ymagnL = "";
        this.ymagnH = "";
        this.zmagnL = "";
        this.zmagnH = "";
        this.xmagn = "";
        this.ymagn = "";
        this.zmagn = "";
        this.asax = 0;
        this.asay = 0;
        this.asaz = 0;

        this.xangle = 0;
        this.yangle = 0;
        this.celsius = 0;
        this.xAdj = 0;      //magnetometer x-value adjusted for sensitivity
        this.yAdj = 0;      //magnetometer y-value adjusted for sensitivity
        this.zAdj = 0;      //magnetometer z-value adjusted for sensitivity
        this.heading = 0;
    }

    wakeUp() {      //tell chip to exit sleep mode
        var i2c = this.i2c;
        try {
            i2c.writeByteSync(this.SA, 0x6B, 1);
        }catch(e) {
            this.log.output("While waking MPU6050: ERROR: ", e);

        }
    }

    readData() {        //read temp and accelerometer data from chip
        var i2c = this.i2c;

        try {


            //   This is for when variables are implimented as array
            this.inputs[0] = i2c.readByteSync(this.SA, 0x3B);  //read byte from data register
            this.inputs[1] = i2c.readByteSync(this.SA, 0x3C);  //read byte from data register
            this.inputs[2] = i2c.readByteSync(this.SA, 0x3D);  //read byte from data register
            this.inputs[3] = i2c.readByteSync(this.SA, 0x3E);  //read byte from data register
            this.inputs[4] = i2c.readByteSync(this.SA, 0x3F);  //read byte from data register
            this.inputs[5] = i2c.readByteSync(this.SA, 0x40);  //read byte from data register
            this.inputs[6] = i2c.readByteSync(this.SA, 0x41);  //read byte from data register
            this.inputs[7] = i2c.readByteSync(this.SA, 0x42);
            this.inputs[8] = i2c.readByteSync(0x68, 0x03);
            this.inputs[9] = i2c.readByteSync(0x68, 0x04);
            this.inputs[10] = i2c.readByteSync(0x68, 0x05);
            this.inputs[11] = i2c.readByteSync(0x68, 0x06);
            this.inputs[12] = i2c.readByteSync(0x68, 0x07);
            this.inputs[13] = i2c.readByteSync(0x68, 0x08);
            // this.inputs[14] = i2c.readByteSync(0x68, 0x10);
            // this.inputs[15] = i2c.readByteSync(0x68, 0x11);
            // this.inputs[16] = i2c.readByteSync(0x68, 0x12);




            // this.xposH = i2c.readByteSync(this.SA, 0x3B);  //read byte from data register
            // this.xposL = i2c.readByteSync(this.SA, 0x3C);  //read byte from data register
            // this.yposH = i2c.readByteSync(this.SA, 0x3D);  //read byte from data register
            // this.yposL = i2c.readByteSync(this.SA, 0x3E);  //read byte from data register
            // this.zposH = i2c.readByteSync(this.SA, 0x3F);  //read byte from data register
            // this.zposL = i2c.readByteSync(this.SA, 0x40);  //read byte from data register
            // this.tempH = i2c.readByteSync(this.SA, 0x41);  //read byte from data register
            // this.tempL = i2c.readByteSync(this.SA, 0x42);  //read byte from data register
            // this.xmagnL = i2c.readByteSync(0x68, 0x03);
            // this.xmagnH = i2c.readByteSync(0x68, 0x04);
            // this.ymagnL = i2c.readByteSync(0x68, 0x05);
            // this.ymagnH = i2c.readByteSync(0x68, 0x06);
            // this.zmagnL = i2c.readByteSync(0x68, 0x07);
            // this.zmagnH = i2c.readByteSync(0x68, 0x08);
            // this.asax = i2c.readByteSync(0x68, 0x10);
            // this.asay = i2c.readByteSync(0x68, 0x11);
            // this.asaz = i2c.readByteSync(0x68, 0x12);
        }catch(e) {
            this.log.output("While reading from MPU6050: ERROR: ", e);
        }


        var k = 0
        for (var i = 0; i < 14; i+=2) {
            this.inputs[i+17-k] = ((Number(this.inputs[i]) << 8) | Number(this.inputs[i+1])).toString(2);
            k++;
        }



        // this.xpos = ((Number(this.xposH) << 8) | Number(this.xposL)).toString(2);
        // this.ypos = ((Number(this.yposH) << 8) | Number(this.yposL)).toString(2);
        // this.zpos = ((Number(this.zposH) << 8) | Number(this.zposL)).toString(2);
        // this.temp = ((Number(this.tempH) << 8) | Number(this.tempH)).toString(2);
        // this.xmagn = ((Number(this.xmagnH) << 8) | Number(this.xmagnL)).toString(2);
        // this.ymagn = ((Number(this.ymagnH) << 8) | Number(this.ymagnL)).toString(2);
        // this.zmagn = ((Number(this.zmagnH) << 8) | Number(this.zmagnL)).toString(2);

        // this.xposL = Number(this.xposL).toString(2);  //convert to binary string
        // this.yposH = Number(this.yposH).toString(2);  //convert to binary string
        // this.xposH = Number(this.xposH).toString(2);  //convert to binary string
        // this.yposL = Number(this.yposL).toString(2);  //convert to binary string
        // this.zposH = Number(this.zposH).toString(2);  //convert to binary string
        // this.zposL = Number(this.zposL).toString(2);  //convert to binary string
        // this.tempH = Number(this.tempH).toString(2);  //convert to binary string
        // this.tempL = Number(this.tempL).toString(2);  //convert to binary string
        // this.xmagnL = Number(this.xmagnL).toString(2);
        // this.xmagnH = Number(this.xmagnH).toString(2);
        // this.ymagnL = Number(this.ymagnL).toString(2);
        // this.ymagnH = Number(this.ymagnH).toString(2);
        // this.zmagnL = Number(this.zmagnL).toString(2);
        // this.zmagnH = Number(this.zmagnH).toString(2);
        // //above functions do not store leading 0's

        // //fills in leading 0's
        // this.xposH = "00000000".substr(this.xposH.length) + this.xposH;  //fill in missing zeros
        // this.xposL = "00000000".substr(this.xposL.length) + this.xposL;  //fill in missing zeros
        // this.yposH = "00000000".substr(this.yposH.length) + this.yposH;  //fill in missing zeros
        // this.yposL = "00000000".substr(this.yposL.length) + this.yposL;  //fill in missing zeros
        // this.zposH = "00000000".substr(this.zposH.length) + this.zposH;  //fill in missing zeros
        // this.zposL = "00000000".substr(this.zposL.length) + this.zposL;  //fill in missing zeros
        // this.tempH = "00000000".substr(this.tempH.length) + this.tempH;  //fill in missing zeros
        // this.tempL = "00000000".substr(this.tempL.length) + this.tempL;  //fill in missing zeros
        // this.xmagnL = "00000000".substr(this.xmagnL.length) + this.xmagnL;
        // this.xmagnH = "00000000".substr(this.xmagnH.length) + this.xmagnH;
        // this.ymagnL = "00000000".substr(this.ymagnL.length) + this.ymagnL;
        // this.ymagnH = "00000000".substr(this.ymagnH.length) + this.ymagnH;
        // this.zmagnL = "00000000".substr(this.zmagnL.length) + this.zmagnL;
        // this.zmagnH = "00000000".substr(this.zmagnH.length) + this.zmagnH;
        // // this.asax = "00000000".substr(this.asax.length) + this.asax;
        // // this.asay = "00000000".substr(this.asay.length) + this.asay;
        // // this.asaz = "00000000".substr(this.asaz.length) + this.asaz;

        // this.xpos = this.xposH + this.xposL;  //combines both strings for 16 bits
        // this.ypos = this.yposH + this.yposL;  //combines both strings for 16 bits
        // this.zpos = this.zposH + this.zposL;  //combines both strings for 16 bits
        // this.temp = this.tempH + this.tempL;  //combines both strings for 16 bits
        // this.xmagn = this.xmagnL + this.xmagnH;
        // this.ymagn = this.ymagnL + this.ymagnH;
        // this.zmagn = this.zmagnL + this.zmagnH;


        for (var i = 17; i < 24; i++) {
            if(this.inputs[i] > "1000000000000000"){   //convert 16 bit to decimal
                this.inputs[i] = parseInt(this.inputs[i],2) - Math.pow(2,16);
            }
            else{
                this.inputs[i] = parseInt(this.inputs[i],2);
            }
        }



        // if(this.xpos > "1000000000000000"){   //convert 16 bit to decimal
        //   this.xpos = parseInt(this.xpos,2) - Math.pow(2,16);
        // }
        // else{
        //   this.xpos = parseInt(this.xpos,2);
        // }

        // if(this.ypos > "1000000000000000"){   //convert 16 bit to decimal
        //   this.ypos = parseInt(this.ypos,2) - Math.pow(2,16);
        // }
        // else{
        //   this.ypos = parseInt(this.ypos,2);
        // }

        // if(this.zpos > "1000000000000000"){   //convert 16 bit to decimal
        //   this.zpos = parseInt(this.zpos,2) - Math.pow(2,16);
        // }
        // else{
        //   this.zpos = parseInt(this.zpos,2);
        // }

        // if(this.temp > "1000000000000000"){   //convert 16 bit to decimal
        //   this.temp = parseInt(this.temp,2) - Math.pow(2,16);
        // }
        // else{
        //   this.temp = parseInt(this.temp,2);
        // }

        // if(this.xmagn > "1000000000000000"){   //convert 16 bit to decimal
        //   this.xmagn = parseInt(this.xmagn,2) - Math.pow(2,16);
        // }
        // else{
        //   this.xmagn = parseInt(this.xmagn,2);
        // }

        // if(this.ymagn > "1000000000000000"){   //convert 16 bit to decimal
        //   this.ymagn = parseInt(this.ymagn,2) - Math.pow(2,16);
        // }
        // else{
        //   this.ymagn = parseInt(this.ymagn,2);
        // }

        // if(this.zmagn > "1000000000000000"){   //convert 16 bit to decimal
        //   this.zmagn = parseInt(this.zmagn,2) - Math.pow(2,16);
        // }
        // else{
        //   this.zmagn = parseInt(this.zmagn,2);
        // }
////////
        // if(this.asax > "10000000"){   //convert 8 bit to decimal
        //   this.asax = parseInt(this.asax,2) - Math.pow(2,16);
        // }
        // else{
        //   this.asax = parseInt(this.asax,2);
        // }

//         if(this.asay > "10000000"){   //convert 8 bit to decimal
//           this.asay = parseInt(this.asay,2) - Math.pow(2,16);
//         }
//         else{
//           this.asay = parseInt(this.asay,2);
//         }

//         if(this.asax > "10000000"){   //convert 8 bit to decimal
//           this.asax = parseInt(this.asax,2) - Math.pow(2,16);
//         }
//         else{
//           this.asax = parseInt(this.asax,2);
//         }

        this.xAdj = this.inputs[21]*((((this.asax-128)*.5)/128)+1);
        this.yAdj = this.inputs[22]*((((this.asay-128)*.5)/128)+1);
        this.zAdj = this.inputs[23]*((((this.asaz-128)*.5)/128)+1);

        // this.xAdj = this.xmagn*((((this.asax-128)*.5)/128)+1);
        // this.yAdj = this.ymagn*((((this.asay-128)*.5)/128)+1);
        // this.zAdj = this.zmagn*((((this.asaz-128)*.5)/128)+1);

        // this.convertPosition();
        // this.convertTemp();
        // this.convertCompass();
        // this.Log();
    }

    convertCompass() {  //returns a degree, 0 degrees is North. Positive degrees move clockwise.
        this.heading = (Math.atan(this.yAdj/this.xAdj) * 180) / Math.PI;
        if (this.heading < 0) {
            this.heading += 360;
        }
        return this.heading;
    }

    convertPosition() {     //converts x- and y-angles
        this.xangle = (57.295*Math.atan(parseFloat(this.inputs[18])/ Math.sqrt(Math.pow(parseFloat(this.inputs[19]),2)+Math.pow(parseFloat(this.inputs[17]),2)))).toFixed(3);
        this.yangle = (57.295*Math.atan(parseFloat(this.inputs[17])/ Math.sqrt(Math.pow(parseFloat(this.inputs[19]),2)+Math.pow(parseFloat(this.inputs[18]),2)))).toFixed(3);

      // this.xangle = (57.295*Math.atan(parseFloat(this.ypos)/ Math.sqrt(Math.pow(parseFloat(this.zpos),2)+Math.pow(parseFloat(this.xpos),2)))).toFixed(3);
      // this.yangle = (57.295*Math.atan(parseFloat(this.xpos)/ Math.sqrt(Math.pow(parseFloat(this.zpos),2)+Math.pow(parseFloat(this.ypos),2)))).toFixed(3);
      // this.xangle = this.xangle.toFixed(3);
    }

    convertTemp() {     //converts to Celsius
        //for mpu6050
        this.celsius = (parseFloat(this.inputs[20])/340 + 36.53).toFixed(3);
        // this.celsius = (parseFloat(this.temp)/340 + 36.53).toFixed(3);
        //for mpu9250
        // this.celsius = parseFloat(this.temp)/333.87 + 21;
    }

    sleep() {       //put chip in sleep mode
        var i2c = this.i2c;
        try {
            i2c.writeByteSync(this.SA, 0x6B, 0);
        }catch(e) {
            this.log.output("While putting MPU6050 to sleep: ERROR: ", e);
        }
    }

    Log() {     //log data measured by chip
        this.log.output(`x-angle: ${this.xangle} y-angle: ${this.yangle} temperature: ${this.celsius}`);/* compass: ${this.heading.(3)}*/
    }
}

module.exports = MPU6050;
