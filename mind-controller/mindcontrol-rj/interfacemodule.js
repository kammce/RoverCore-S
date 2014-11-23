/*
The interfacemodule.js is intended to be run in directory above interfacemail (i.e. it's in same directory as mailboxes)
*/

var fs = require('fs'); //Allows use of file system functions and commands										

function interfaceComms(){
	var inbox = fs.createReadStream('mailboxes/interfacemail'); //creates readstream to interfacemail, allowing interfacemodule to 'read' its mail
	var send2mind = fs.createWriteStream('mailboxes/mindmail'); //creates writestream to mindmail, allowing interfacemodule
																//to 'write and send' mail to mindcontroller
	inbox.on('data', function(data){
		if(data == 'Ready?'){
			send2mind.write('Interface Ready;');
		}
	});
}
 
interfaceComms();