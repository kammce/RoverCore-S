var i2c = require('i2c-bus');
	i2c3 = i2c.openSync(3);

var MUX_ADDR = 0x70;
var IO_EXPANDER_ADDR = 0x41;
var which = [true, true];
var cmd = 0x00;

//console.log(i2c3.scanSync());
console.log(i2c3.i2cFuncsSync());

// enable all channels
cmd = [ 0xFF ];
console.log(cmd.length);
i2c3.sendByteSync(MUX_ADDR, 0xFF);
cmd = [ 0x03, 0x00 ];
i2c3.writeByteSync(IO_EXPANDER_ADDR, cmd[0], cmd[1]);

var deter = true;

cmd = 0x00;
if(deter) {
	setInterval(function() {
		if(which[0]) {
			cmd |= (0x01 << 0);
		} else {
			cmd &= ~(0x01 << 0);
		}
		i2c3.writeByte(IO_EXPANDER_ADDR, 0x01, cmd, function() {});
		which[0] = !which[0];
	}, 0);
	setInterval(function() {
		if(which[1]) {
			cmd |= (0x01 << 1);
		} else {
			cmd &= ~(0x01 << 1);
		}
		i2c3.writeByte(IO_EXPANDER_ADDR, 0x01, cmd, function() {});
		which[1] = !which[1];
	}, 0);
	setInterval(function() {
		if(which[2]) {
			cmd |= (0x01 << 2);
		} else {
			cmd &= ~(0x01 << 2);
		}
		i2c3.writeByte(IO_EXPANDER_ADDR, 0x01, cmd, function() {});
		which[2] = !which[2];
	}, 0);
	setInterval(function() {
		if(which[3]) {
			cmd |= (0x01 << 3);
		} else {
			cmd &= ~(0x01 << 3);
		}
		i2c3.writeByte(IO_EXPANDER_ADDR, 0x01, cmd, function() {});
		which[3] = !which[3];
	}, 0);

} else {
	while(true) {
		if(which) {
			cmd = 0x00;
		} else {
			cmd = 0xFF;
		}
		i2c3.writeByteSync(IO_EXPANDER_ADDR, 0x01, cmd, function() {});
		which = !which;
	}
}
