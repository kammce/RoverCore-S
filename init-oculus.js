if( process.argv.length < 3 ) {
	console.log(
		'Usage: \n' +
		'\tnode init-oculus.js <websocket-server-address>\n'+
		'Hints: server address can be\n' +
		'\tlocalhost\n' + 
		'\tor discovery.srkarra.com\n' + 
		'\tor sce.engr.sjsu.edu\n' +
		'\tor kammce.io'
	);
	process.exit();
}

var forever = require('forever-monitor');

var child = new (forever.Monitor)('oculus.js', {
	max: 20,
	silent: false,
	args: [process.argv[2]]
});

child.on('exit', function () {
	console.log('oculus.js has exited after 3 restarts');
});

child.start();