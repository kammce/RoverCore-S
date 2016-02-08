var fs = require('fs');
var serialport = require('serialport'),// include the library
   SerialPort = serialport.SerialPort, // make a local instance of it
   portName = process.argv[2];   // <-- get port name from the command line (node GPS.js *NAME*)
var myPort = new SerialPort(portName, { // <--Then you open the port using new() like so
   baudRate: 9600,
   parser: serialport.parsers.readline("\r\n") // look for return and newline at the end of each data packet
 });
var io = require('socket.io').listen(8085);

io.sockets.on('connection', function (socket) {
  console.log('socket connected!');
});

myPort.on('open', showPortOpen);
myPort.on('close', showPortClose);
myPort.on('error', showError);
myPort.on('data', saveLatestData);
function showPortOpen() {
   	console.log('port open. Data rate: ' + myPort.options.baudRate);
   	console.log("begin initialization");//begin initialization
	myPort.write("$PMTK314,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*29\r\n");
	myPort.write("$PMTK220,200*2C\r\n");          //5hz update
	myPort.write("$PMTK300,200,0,0,0,0*2F\r\n");  //    //5hz
	console.log("initialization complete!"); //print out to terminal
}
function showPortClose() {
   console.log('port closed.');
}
function showError(error) {
   console.log('Serial port error: ' + error);
}
function saveLatestData(data) {
  if(data.substring(0,6) =="$GPRMC" ){
    var piece = data.split(",",7);
    console.log(piece[0],piece[2]); //$GPRMC, A/V
    console.log(piece[3],piece[4]); // LAT, dir
    console.log(piece[5],piece[6]); // LONG, dir

    //fs.appendFile('message.txt', 'data to append', function (err) {});    //how it should look

    
    fs.appendFile("/tmp/test", data+('\n'), function(err) { //start file out
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});                                                 //end file out
 //this normally prints:
    //console.log(' '); //adds line to separate
    //console.log(data); // full unparsed data
    var piece = data.split(",",7);
    //console.log(piece[0],piece[2]); //$GPRMC, A/V
    //console.log(piece[3],piece[4]); // LAT, dir
    //console.log(piece[5],piece[6]); // LONG, dir
    //making variables
    var lat = piece[3];
    var lat_dir = piece[4];
    var lng = piece[5];
    var lng_dir = piece[6];
    io.emit("GPS_UPDATE", {lat_dir: lat_dir, lat: lat, lng_dir: lng_dir, lng: lng});
  }
}