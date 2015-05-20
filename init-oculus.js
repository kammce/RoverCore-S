if( process.argv.length < 4 ) {
	console.log(
		'Usage: \n' +
		'\tnode init-oculus.js <websocket-server-address> <stream>\n'+
		'Hints: server address can be\n' +
		'\tlocalhost\n' + 
		'\tor discovery.srkarra.com\n' + 
		'\tor sce.engr.sjsu.edu\n' +
		'\tor kammce.io'
	);
	process.exit();
}
if(process.argv[3] < 0 || process.argv[3] > 1) {
	console.log("You must select a stream between 0 and 2");
	process.exit();
}
var forever = require('forever-monitor');

var child = new (forever.Monitor)('oculus.js', {
	max: 50,
	silent: false,
	args: [process.argv[2], process.argv[3]]
});

child.on('exit', function () {
	console.log('oculus.js has exited after 50 restarts');
});

child.start();
