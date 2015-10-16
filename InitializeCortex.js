if( process.argv.length < 3 ) {
	console.log(
		'Usage: \n' +
		'\tnode init-cortex.js <websocket-server-address> --simulate\n'+
		'Hints: server address can be\n' +
		'\tlocalhost\n' + 
		'\tor sce.engr.sjsu.edu\n' +
		'\tor kammce.io'
	);
	process.exit();
}

var forever = require('forever-monitor');

var child = new (forever.Monitor)('cortex.js', {
	max: 200,
	silent: false,
	args: [process.argv[2]]
});

child.on('exit', function () {
	console.log('cortex.js has exited after 50 restarts');
});

child.start();
