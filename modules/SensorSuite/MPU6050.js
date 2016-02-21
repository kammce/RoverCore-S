"use strict";

class MPU6050{
    constructor(i2c, log) {
        // Construct Class here
        //need this because i2c is created in rovercore
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

        this.xangle = 0;
        this.yangle = 0;
        this.celsius = 0;

        this.awake = 0;
        this.r0x3B = "10110100";
        this.r0x3C = "10110100";
        this.r0x3D = "10110100";
        this.r0x3E = "10110100";
        this.r0x3F = "10110100";
        this.r0x40 = "10110100";
        this.r0x41 = "10110100";
        this.r0x42 = "10110100";
    }

    readData() {

        var i2c = this.i2c;

        this.xposH = i2c.readByteSync(0x68, this.r0x3B);  //read byte from data register
        this.xposL = i2c.readByteSync(0x68, this.r0x3C);  //read byte from data register
        this.yposH = i2c.readByteSync(0x68, this.r0x3D);  //read byte from data register
        this.yposL = i2c.readByteSync(0x68, this.r0x3E);  //read byte from data register
        this.zposH = i2c.readByteSync(0x68, this.r0x3F);  //read byte from data register
        this.zposL = i2c.readByteSync(0x68, this.r0x40);  //read byte from data register
        this.tempH = i2c.readByteSync(0x68, this.r0x41);  //read byte from data register
        this.tempL = i2c.readByteSync(0x68, this.r0x42);  //read byte from data register

        this.xposL = Number(this.xposL).toString(2);  //convert to binary string
        this.yposH = Number(this.yposH).toString(2);  //convert to binary string
        this.xposH = Number(this.xposH).toString(2);  //convert to binary string
        this.yposL = Number(this.yposL).toString(2);  //convert to binary string
        this.zposH = Number(this.zposH).toString(2);  //convert to binary string
        this.zposL = Number(this.zposL).toString(2);  //convert to binary string
        this.tempH = Number(this.tempH).toString(2);  //convert to binary string
        this.tempL = Number(this.tempL).toString(2);  //convert to binary string

        this.xposH = "00000000".substr(this.xposH.length) + this.xposH; //fill in missing zeros
        this.xposL = "00000000".substr(this.xposL.length) + this.xposL; //fill in missing zeros
        this.yposH = "00000000".substr(this.yposH.length) + this.yposH; //fill in missing zeros
        this.yposL = "00000000".substr(this.yposL.length) + this.yposL; //fill in missing zeros
        this.zposH = "00000000".substr(this.zposH.length) + this.zposH; //fill in missing zeros
        this.zposL = "00000000".substr(this.zposL.length) + this.zposL; //fill in missing zeros
        this.tempH = "00000000".substr(this.tempH.length) + this.tempH; //fill in missing zeros
        this.tempL = "00000000".substr(this.tempL.length) + this.tempL; //fill in missing zeros

        this.xpos = this.xposH + this.xposL;  //combines both strings for 16 bits
        this.ypos = this.yposH + this.yposL;  //combines both strings for 16 bits
        this.zpos = this.zposH + this.zposL;  //combines both strings for 16 bits
        this.temp = this.tempH + this.tempL;  //combines both strings for 16 bits

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
    }

    convertPosition() {     //converts to Angles
      this.xangle = 57.295*Math.atan(parseFloat(this.ypos)/ Math.sqrt(Math.pow(parseFloat(this.zpos),2)+Math.pow(parseFloat(this.xpos),2)));
      this.yangle = 57.295*Math.atan(parseFloat(this.xpos)/ Math.sqrt(Math.pow(parseFloat(this.zpos),2)+Math.pow(parseFloat(this.ypos),2)));
    }

    convertTemp() {     //converts to Celsius
        this.celsius = parseFloat(this.temp)/340 + 36.53;
    }

    log() {
        var log = this.log;
//        log.output("x-angle:" + this.xangle + "y-angle:" + this.yangle + "temperature:" + this.temp);
        log.output("hello");
    }
}

module.exports = MPU6050;
