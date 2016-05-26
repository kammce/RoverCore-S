"use strict";

class MPU6050{
    constructor(SA, i2c, log) {
        //need this because i2c is created in rovercore
        this.SA = SA;
        this.i2c = i2c;
        this.log = log;
        this.inputs = [];
        // index 0-16: xposH, xposL, yposH, yposL, zposH, zposL, tempH, tempL, xmagnH, xmagnL, ymagnH, ymagnL, zmagnH, zmagnL, asax, asay, asaz
        // index 17-23: xpos, ypos, zpos, temp, xmagn, ymagn, zmagn
        // index 24-26: xAdj, yAdj, zAdj
        // index 27-30: xangle (roll), yangle (pitch), celsius, heading
        // index 31-32: DRDY (data ready), Status bit for magnetometer

        this.registerArray = [0x3B, 0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x04, 0x03, 0x06, 0x05, 0x08, 0x07, 0x10, 0x11, 0x12];

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

            setTimeout(this.readAccel(),50);
            setTimeout(this.readMagn(),50);

        }catch(e) {
            this.log.output("While reading from MPU6050: ERROR: ", e);
        }

        //combines into a 16-bit number
        //0-14 when magnetomoter data being used
        //0-8 when not using magnetometer data
        for (var i = 0, k = 17; i < 14; i+=2, k++) {
            this.inputs[k] = ((Number(this.inputs[i]) << 8) | Number(this.inputs[i+1]));
        }

        for (var i = 17; i < 24; i++) {
            if(this.inputs[i] > 32768){
                this.inputs[i] = this.inputs[i] - Math.pow(2,16);
            }
        }
        var mRes = 10*4912/32760;
        this.inputs[24] = this.inputs[21]*(((this.inputs[14]-128)/256)+1)*mRes;
        this.inputs[25] = this.inputs[22]*(((this.inputs[15]-128)/256)+1)*mRes;
        this.inputs[26] = this.inputs[23]*(((this.inputs[16]-128)/256)+1)*mRes;

        for (var i = 24; i < 27; i++) {
            if(this.inputs[i] > 32768){
                this.inputs[i] = this.inputs[i] - Math.pow(2,16);
            }
        }

        this.convertPosition();
        this.convertTemp();
        this.convertCompass();
    }

    readMagn() {
        var i2c = this.i2c;

        i2c.writeByteSync(0x0C, 0x0A, 0x01);
        this.inputs[31] = i2c.readByteSync(0x0C, 0x02); //begin magnetometer read
        if (this.inputs[31] === 1 || this.inputs[31] === 3) {
            for (var i = 8; i < 17; i++) {
                this.inputs[i] = i2c.readByteSync(0x0C, this.registerArray[i]);
            }
            this.inputs[32] = i2c.readByteSync(0x0C, 0x09); // Status bit - end magnetometer read
        }
        i2c.writeByteSync(this.SA, 0x37, 0x00);
    }

    readAccel() {
        var i2c = this.i2c;

        for (var i = 0; i < 8; i++) {
            this.inputs[i] = i2c.readByteSync(this.SA, this.registerArray[i]);
        }
        i2c.writeByteSync(this.SA, 0x37, 0x02);
    }

    convertCompass() {  //returns a degree, 0 degrees is North. Positive degrees move clockwise.
        var ayf = this.inputs[28]*Math.PI/180;
        var axf = this.inputs[27]*Math.PI/180;
        var X_h = this.inputs[24]*Math.cos(ayf) + this.inputs[25]*Math.sin(axf)*Math.sin(ayf) - this.inputs[26]*Math.cos(axf)*Math.sin(ayf);
        var Y_h = this.inputs[25]*Math.cos(axf) - this.inputs[26]*Math.sin(axf);

        this.inputs[30] = Number((Math.atan(Y_h/X_h)*180/Math.PI).toFixed(3));   //tilted surface compass
        if(X_h<0)   this.inputs[30] = 180 - this.inputs[30];
        else if(X_h>0  && Y_h<0)  this.inputs[30]=-this.inputs[30];
        else if(X_h>0  && Y_h>0)  this.inputs[30]=360-this.inputs[30];
        else if(X_h===0 && Y_h<0) this.inputs[30]=90;
        else if(X_h===0 && Y_h>0) this.inputs[30]=270;
    }

    convertPosition() {     //converts x- and y-angles
        this.inputs[27] = Number((Math.atan2(this.inputs[18], this.inputs[19])*180/Math.PI).toFixed(3));
        // this.inputs[27] = Number((57.295*Math.atan(parseFloat(this.inputs[18])/ Math.sqrt(Math.pow(parseFloat(this.inputs[19]),2)+Math.pow(parseFloat(this.inputs[17]),2)))).toFixed(3));
        this.inputs[28] = Number((Math.atan2(this.inputs[17], this.inputs[19])*180/Math.PI).toFixed(3));
        // this.inputs[28] = Number((Math.atan2(this.inputs[17], Math.sqrt(this.inputs[18]*this.inputs[18] + this.inputs[19]*this.inputs[19]))*180/Math.PI).toFixed(3));
        // this.inputs[28] = Number((57.295*Math.atan(parseFloat(this.inputs[17])/ Math.sqrt(Math.pow(parseFloat(this.inputs[19]),2)+Math.pow(parseFloat(this.inputs[18]),2)))).toFixed(3));
    }

    convertTemp() {     //converts to Celsius
        //for mpu6050
        // this.inputs[29] = (parseFloat(this.inputs[20])/340 + 36.53).toFixed(3);
        //for mpu9250
        this.inputs[29] = Number((parseFloat(this.inputs[20])/333.87 + 21).toFixed(3));
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
        this.log.output(`roll: ${this.inputs[27]} pitch: ${this.inputs[28]} temperature: ${this.inputs[29]} heaading: ${this.inputs[30]}`);
    }
}

module.exports = MPU6050;
