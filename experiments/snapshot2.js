var MjpegCamera = require('mjpeg-camera');
var fs = require('fs');

// Create an MjpegCamera instance
var camera = new MjpegCamera({
	url: 'http://localhost:9001',
	motion: true
});
camera.getScreenshot(function(err, frame)
{
	console.log(err);
	fs.writeFile('final.jpeg', frame, process.exit);
});