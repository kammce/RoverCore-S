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

        // this.xmagnL = "";
        // this.xmagnH = "";
        // this.ymagnL = "";
        // this.ymagnH = "";
        // this.zmagnL = "";
        // this.zmagnH = "";
        // this.xmagn = "";
        // this.ymagn = "";
        // this.zmagn = "";
        // this.asax = "";
        // this.asay = "";
        // this.asaz = "";

        this.xangle = 0;
        this.yangle = 0;
        this.celsius = 0;
        // this.xAdj = 0;      //magnetometer x-value adjusted for sensitivity
        // this.yAdj = 0;      //magnetometer y-value adjusted for sensitivity
        // this.zAdj = 0;      //magnetometer z-value adjusted for sensitivity
        // this.heading = 0;
    }

    wakeUp() {      //tell chip to exit sleep mode
        var i2c = this.i2c;
        try {
            i2c.writeByteSync(this.SA, 0x6B, 1);
        }catch(e) {
            console.log(e);

        }
    }

    readData() {        //read temp and accelerometer data from chip
        var i2c = this.i2c;

        try {
            this.xposH = i2c.readByteSync(this.SA, 0x3B);  //read byte from data register
            this.xposL = i2c.readByteSync(this.SA, 0x3C);  //read byte from data register
            this.yposH = i2c.readByteSync(this.SA, 0x3D);  //read byte from data register
            this.yposL = i2c.readByteSync(this.SA, 0x3E);  //read byte from data register
            this.zposH = i2c.readByteSync(this.SA, 0x3F);  //read byte from data register
            this.zposL = i2c.readByteSync(this.SA, 0x40);  //read byte from data register
            this.tempH = i2c.readByteSync(this.SA, 0x41);  //read byte from data register
            this.tempL = i2c.readByteSync(this.SA, 0x42);  //read byte from data register
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
            console.log(e);
        }



        this.xposL = Number(this.xposL).toString(2);  //convert to binary string
        this.yposH = Number(this.yposH).toString(2);  //convert to binary string
        this.xposH = Number(this.xposH).toString(2);  //convert to binary string
        this.yposL = Number(this.yposL).toString(2);  //convert to binary string
        this.zposH = Number(this.zposH).toString(2);  //convert to binary string
        this.zposL = Number(this.zposL).toString(2);  //convert to binary string
        this.tempH = Number(this.tempH).toString(2);  //convert to binary string
        this.tempL = Number(this.tempL).toString(2);  //convert to binary string
        // this.xmagnL = Number(this.xmagnL).toString(2);
        // this.xmagnH = Number(this.xmagnH).toString(2);
        // this.ymagnL = Number(this.ymagnL).toString(2);
        // this.ymagnH = Number(this.ymagnH).toString(2);
        // this.zmagnL = Number(this.zmagnL).toString(2);
        // this.zmagnH = Number(this.zmagnH).toString(2);
        //above functions do not store leading 0's

        //fills in leading 0's
        this.xposH = "00000000".substr(this.xposH.length) + this.xposH;  //fill in missing zeros
        this.xposL = "00000000".substr(this.xposL.length) + this.xposL;  //fill in missing zeros
        this.yposH = "00000000".substr(this.yposH.length) + this.yposH;  //fill in missing zeros
        this.yposL = "00000000".substr(this.yposL.length) + this.yposL;  //fill in missing zeros
        this.zposH = "00000000".substr(this.zposH.length) + this.zposH;  //fill in missing zeros
        this.zposL = "00000000".substr(this.zposL.length) + this.zposL;  //fill in missing zeros
        this.tempH = "00000000".substr(this.tempH.length) + this.tempH;  //fill in missing zeros
        this.tempL = "00000000".substr(this.tempL.length) + this.tempL;  //fill in missing zeros
        // this.xmagnL = "00000000".substr(this.xmagnL.length) + this.xmagnL;
        // this.xmagnH = "00000000".substr(this.xmagnH.length) + this.xmagnH;
        // this.ymagnL = "00000000".substr(this.ymagnL.length) + this.ymagnL;
        // this.ymagnH = "00000000".substr(this.ymagnH.length) + this.ymagnH;
        // this.zmagnL = "00000000".substr(this.zmagnL.length) + this.zmagnL;
        // this.zmagnH = "00000000".substr(this.zmagnH.length) + this.zmagnH;
        // this.asax = "00000000".substr(this.asax.length) + this.asax;
        // this.asay = "00000000".substr(this.asay.length) + this.asay;
        // this.asaz = "00000000".substr(this.asaz.length) + this.asaz;

        this.xpos = this.xposH + this.xposL;  //combines both strings for 16 bits
        this.ypos = this.yposH + this.yposL;  //combines both strings for 16 bits
        this.zpos = this.zposH + this.zposL;  //combines both strings for 16 bits
        this.temp = this.tempH + this.tempL;  //combines both strings for 16 bits
        // this.xmagn = this.xmagnL + this.xmagnH;
        // this.ymagn = this.ymagnL + this.ymagnH;
        // this.zmagn = this.zmagnL + this.zmagnH;



        if(this.xpos > "1000000000000000"){   //convert 16 bit to decimal
          this.xpos = parseInt(this.xpos,2) - Math.pow(2,16);
        }
        else{
          this.xpos = parseInt(this.xpos,2);
        }

        if(this.ypos > "1000000000000000"){   //convert 16 bit to decimal
          this.ypos = parseInt(this.ypos,2) - Math.pow(2,16);
        }
        else{
          this.ypos = parseInt(this.ypos,2);
        }

        if(this.zpos > "1000000000000000"){   //convert 16 bit to decimal
          this.zpos = parseInt(this.zpos,2) - Math.pow(2,16);
        }
        else{
          this.zpos = parseInt(this.zpos,2);
        }

        if(this.temp > "1000000000000000"){   //convert 16 bit to decimal
          this.temp = parseInt(this.temp,2) - Math.pow(2,16);
        }
        else{
          this.temp = parseInt(this.temp,2);
        }

//         if(this.xmagn > "1000000000000000"){   //convert 16 bit to decimal
//           this.xmagn = parseInt(this.xmagn,2) - Math.pow(2,16);
//         }
//         else{
//           this.xmagn = parseInt(this.xmagn,2);
//         }

//         if(this.ymagn > "1000000000000000"){   //convert 16 bit to decimal
//           this.ymagn = parseInt(this.ymagn,2) - Math.pow(2,16);
//         }
//         else{
//           this.ymagn = parseInt(this.ymagn,2);
//         }

//         if(this.zmagn > "1000000000000000"){   //convert 16 bit to decimal
//           this.zmagn = parseInt(this.zmagn,2) - Math.pow(2,16);
//         }
//         else{
//           this.zmagn = parseInt(this.zmagn,2);
//         }
// ////////
//         if(this.asax > "10000000"){   //convert 8 bit to decimal
//           this.asax = parseInt(this.asax,2) - Math.pow(2,16);
//         }
//         else{
//           this.asax = parseInt(this.asax,2);
//         }

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

//         this.xAdj = this.xmagn*((((this.asax-128)*.5)/128)+1);
//         this.yAdj = this.ymagn*((((this.asay-128)*.5)/128)+1);
//         this.zAdj = this.zmagn*((((this.asaz-128)*.5)/128)+1);

        this.convertPosition();
        this.convertTemp();
        // this.convertCompass();
        // this.Log();
    }

    // convertCompass() {  //returns a degree, 0 degrees is North. Positive degrees move clockwise.
    //     this.heading = (Math.atan2(this.yAdj,this.xAdj) * 180) / Math.PI;
    //     if (this.heading < 0) {
    //         this.heading += 360;
    //     }
    //     return this.heading;
    // }

    convertPosition() {     //converts x- and y-angles
      this.xangle = 57.295*Math.atan(parseFloat(this.ypos)/ Math.sqrt(Math.pow(parseFloat(this.zpos),2)+Math.pow(parseFloat(this.xpos),2)));
      this.yangle = 57.295*Math.atan(parseFloat(this.xpos)/ Math.sqrt(Math.pow(parseFloat(this.zpos),2)+Math.pow(parseFloat(this.ypos),2)));
    }

    convertTemp() {     //converts to Celsius
        //for mpu6050
        this.celsius = parseFloat(this.temp)/340 + 36.53;
        //for mpu9250
        // this.celsius = parseFloat(this.temp)/333.87 + 21;
    }

    sleep() {       //put chip in sleep mode
        var i2c = this.i2c;
        try {
            i2c.writeByteSync(this.SA, 0x6B, 0);
        }catch(e) {
            console.log(e);
        }
    }

    Log() {     //log data measured by chip
        //console.log("x-angle: " + this.xangle.toFixed(3) + ", y-angle: " + this.yangle.toFixed(3) + ", temperature: " + this.celsius.toFixed(3));
        this.log.output(`x-angle: ${this.xangle.toFixed(3)} y-angle: ${this.yangle.toFixed(3)} temperature: ${this.celsius.toFixed(3)}/* compass: ${this.heading.toFixed(3)}*/`);
    }
}

module.exports = MPU6050;
