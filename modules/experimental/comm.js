var serialPort = require("serialPort");
serialPort = new SerialPort("/dev/tty-usbserial1", {
  baudrate: 9600
});


  setInterval(function(){serialPort.on("open", function () {
  console.log('open');
  serialPort.on('data', function(data) {
  console.log('data received: ' + data);
 }); }, 3000);