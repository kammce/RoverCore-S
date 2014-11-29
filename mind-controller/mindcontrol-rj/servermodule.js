/*
The motormodule.js is intended to be run in directory above servermail (i.e. it's in same directory as mailboxes)
*/
var fs = require('fs'); //Allows use of file system functions and commands
//var evt = require('events');
										

function serverComms(){
	var inbox = fs.createReadStream('mailboxes/servermail'); //creates readstream to servermail, allowing servermodule to 'read' its mail
	var send2mind = fs.createWriteStream('mailboxes/mindmail'); //creates writestream to mindmail, allowing servermodule
																//to 'write and send' mail to mindcontroller
	inbox.on('data', function(data){
		if(data == 'Ready?'){
			// evt.send2mind.once('drain', function (stream){
			//	stream.write('Server Ready');
				send2mind.write('Server Ready;');
			// });
		}
	});
}
 
serverComms();