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
        // var d;
        try {
            // i2c.writeByteSync(0x0C, 0x0A, 0x00);
            // i2c.writeByteSync(this.SA, 0x0A, 0x0F);
            // d = i2c.readByteSync(0x68, 0x00);
            // this.log.output("I AM ", d, " I should be: 0x48");
            // i2c.writeByteSync(this.SA, 0x0B, 1);
            // i2c.writeByteSync(0x0C, 0x0A, 0x01);
            i2c.writeByteSync(this.SA, 0x6B, 1);
        }catch(e) {
            this.log.output("While waking MPU6050: ERROR: ", e);
        }
    }

    readData() {        //read temp and accelerometer data from chip
        var i2c = this.i2c;
        try {

            // for(var i = 0; i < 17; i++){
            //     if(this.inputs[31] === '1'){
            //         this.inputs[i] = i2c.readByteSync(this.SA, this.registerArray[i]);
            //     }
            //     else {
            //         if(i > 8 && i < 14);
            //         else this.inputs[i] = i2c.readByteSync(this.SA, this.registerArray[i]);
            //     }
            // }
            setTimeout(this.readAccel(),50);
            // setTimeout(this.readMagn(),50);
            // }

        }catch(e) {
            this.log.output("While reading from MPU6050: ERROR: ", e);
        }

        //combines into a 16-bit string
        var k = 0;
        //0-14 when magnetomoter data being used
        for (var i = 0; i < 8; i+=2) {
            this.inputs[i+17-k] = ((Number(this.inputs[i]) << 8) | Number(this.inputs[i+1]));
            // this.inputs[i+17-k] = (Number(this.inputs[i])).toString(2) + (Number(this.inputs[i+1])).toString(2);
            k++;
        }

        // for (var i = 14; i < 17; i++) {
        //     this.inputs[i] = this.inputs[i].toString(2);
        // }

        // for(var i = 14; i < 17; i++){
        //     if(this.inputs[i] > "10000000"){   //convert 16 bit to decimal
        //         this.inputs[i] = parseInt(this.inputs[i],2) - Math.pow(2,8);
        //     }
        //     else{
        //         this.inputs[i] = parseInt(this.inputs[i],2);
        //     }
        // }

        // this.inputs[24] = this.inputs[21]*((((this.inputs[14]-128)*0.5)/128)+1);
        // this.inputs[25] = this.inputs[22]*((((this.inputs[15]-128)*0.5)/128)+1);
        // this.inputs[26] = this.inputs[23]*((((this.inputs[16]-128)*0.5)/128)+1);

        for (var i = 17; i < 24; i++) {
            if(this.inputs[i] > 32768){
                this.inputs[i] = this.inputs[i] - Math.pow(2,16);
            }
        }

        this.convertPosition();
        this.convertTemp();
        // this.convertCompass();
    }

    readMagn() {
        var i2c = this.i2c;

        i2c.writeByteSync(0x0C, 0x0A, 0x01);
        this.inputs[31] = i2c.readByteSync(0x0C, 0x02); //begin magnetometer read
        if (this.inputs[31] === 1 || this.inputs[31] === 3) {
            this.inputs[8] = i2c.readByteSync(0x0C, 0x04); //xmagnH
            this.inputs[9] = i2c.readByteSync(0x0C, 0x03); //xmagnL
            this.inputs[10] = i2c.readByteSync(0x0C, 0x06); //ymagnH
            this.inputs[11] = i2c.readByteSync(0x0C, 0x05); //ymagnL
            this.inputs[12] = i2c.readByteSync(0x0C, 0x08); //zmagnH
            this.inputs[13] = i2c.readByteSync(0x0C, 0x07); //zmagnL
            this.inputs[32] = i2c.readByteSync(0x0C, 0x09); // Status bit - end magnetometer read
        }
        this.inputs[14] = i2c.readByteSync(0x0C, 0x10); //asax
        this.inputs[15] = i2c.readByteSync(0x0C, 0x11); //asay
        this.inputs[16] = i2c.readByteSync(0x0C, 0x12); //asaz
        i2c.writeByteSync(this.SA, 0x37, 0x00);
    }

    readAccel() {
        var i2c = this.i2c;

        this.inputs[0] = i2c.readByteSync(this.SA, 0x3B);  //read byte from data register
        this.inputs[1] = i2c.readByteSync(this.SA, 0x3C);  //read byte from data register
        this.inputs[2] = i2c.readByteSync(this.SA, 0x3D);  //read byte from data register
        this.inputs[3] = i2c.readByteSync(this.SA, 0x3E);  //read byte from data register
        this.inputs[4] = i2c.readByteSync(this.SA, 0x3F);  //read byte from data register
        this.inputs[5] = i2c.readByteSync(this.SA, 0x40);  //read byte from data register
        this.inputs[6] = i2c.readByteSync(this.SA, 0x41);  //read byte from data register
        this.inputs[7] = i2c.readByteSync(this.SA, 0x42);
        // i2c.writeByteSync(this.SA, 0x37, 0x02);
    }

    convertCompass() {  //returns a degree, 0 degrees is North. Positive degrees move clockwise.
        this.inputs[30] = Number(((Math.atan(this.inputs[25]/this.inputs[24]) * 180) / Math.PI).toFixed(3));
        if (this.inputs[30] < 0) {
            this.inputs[30] += 360;
        }
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
        this.log.output(`pitch: ${this.inputs[27]} roll: ${this.inputs[28]} temperature: ${this.inputs[29]}`);/* compass: ${this.heading.(3)}*/
    }
}

module.exports = MPU6050;
