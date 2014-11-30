/*
The motormodule.js is intended to be run in directory above motormail (i.e. it's in same directory as mailboxes)
*/

var fs = require('fs'); //Allows use of file system functions and commands
										

function motorComms(){
	var inbox = fs.createReadStream('mailboxes/motormail'); //creates readstream to motormail, allowing motormodule to 'read' its mail
	var send2mind = fs.createWriteStream('mailboxes/mindmail'); //creates writestream to mindmail, allowing motormodule
																//to 'write and send' mail to mindcontroller
	inbox.on('data', function(data){
		if(data == 'Ready?'){
			send2mind.write('Motors Ready;');
		}
	});
}
 
motorComms();