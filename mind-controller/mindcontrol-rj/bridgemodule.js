/*
The bridgemodule.js is intended to be run in directory above bridgemail (i.e. it's in same directory as mailboxes)
*/

var fs = require('fs'); //Allows use of file system functions and commands
										

function bridgeComms(){
	var inbox = fs.createReadStream('mailboxes/bridgemail'); //creates readstream to bridgemail, allowing bridgemodule to 'read' its mail
	var send2mind = fs.createWriteStream('mailboxes/mindmail'); //creates writestream to mindmail, allowing bridgemodule
																//to 'write and send' mail to mindcontroller
	inbox.on('data', function(data){
		if(data == 'Ready?'){
			send2mind.write('Bridge Ready;');
		}
	});
}
 
bridgeComms();