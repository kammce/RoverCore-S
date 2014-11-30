/*
The mindcontroller.js is intended to be run in directory above mindmail (i.e. it's in same directory as mailboxes folder)
*/
var fs = require('fs'); //Allows use of file system functions and commands
var broadcast = require('./funcExports/broadcast'); //require the function exported by broadcast.js, although the '.js' is omitted
var mailstreams = require('./funcExports/makeWriteables');
var util = require('util'); //Used to allow the sending of data thru stdout
var cproc = require('child_process'); 	/*
										Child Process class, allows use of child process functions and commands.
										The one I'll be using is child_process.exec(), a function that allows 
										a string to be interpreted as a system terminal command.

										Syntax: child_process.exec('commandString', [optional options], callback)
										*/		

function callModules(error, stdout, stderr){
	//Mail Streams (Delivery Routes)
	var inbox = fs.createReadStream('mailboxes/mindmail'); //creates readstream, allowing mindcontroller to 'read' its mail
	var outboxes = ['send2motor', 
					'send2interface', 
					'send2server', 
					'send2bridge'
				   ]; /*Important: 	1.) # of outboxes == # of paths, else a mailbox(es) won't get streamed
							  		2.) index of outbox must match index of corresponding path*/
	var outboxpaths = ['mailboxes/motormail', 
					   'mailboxes/interfacemail', 
					   'mailboxes/servermail', 
					   'mailboxes/bridgemail'
					  ];
	//Check for invalid Mailboxes
	if(outboxes.length != outboxpaths.length){
		if(outboxes.length > outboxpaths.length){
			var problem = 'CriticalError:  One or more outbox writeStream paths is not defined';
		}
		else if(outboxes.length < outboxpaths.length){
			var problem = 'CriticalError:  One or more outbox writeStreams is unused';
		}
		util.puts(problem);
		inbox.close(); //Stop reading from mailbox mindmail b/c of critical error
	}
	else{ //If no invalid mailboxes, continue normally
		mailstreams(outboxes, outboxpaths);

		//Module Program Instances
		cproc.spawn('node', ['motormodule.js']); 	
		cproc.spawn('node', ['interfacemodule.js']);
		cproc.spawn('node', ['bridgemodule.js']);
		cproc.spawn('node', ['servermodule.js']);	//spawns another instance of node to run motormodule.
													//Syntax: child_process.spawn('commandString', ['stringArgInAnArray'], {optionalOptions})
		//Ready Broadcast Function
		broadcast(outboxes);
		//Mail Handling
		inbox.on('data', function(incomingMail){ //specifies what to do when there is mail in mindcontroller's inbox
			util.puts("MindMailbox: " + incomingMail);
		});
		inbox.on('error', function(error){
			util.puts("MindMailbox~~" + error);
		});
		inbox.on('end', function(){ //Note that FIFOs don't have an end necessarily, so this point may not be reached.
			util.puts("**End");
		});
	}
}

cproc.exec('mkfifo mailboxes/mindmail mailboxes/motormail mailboxes/interfacemail mailboxes/bridgemail mailboxes/servermail', callModules);  
	//Executes the commands in parentheses as if I had typed them in terminal
