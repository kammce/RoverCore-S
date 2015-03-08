// This program is for testing arm.js independently (i.e. without use of cortex.js)
var input = process.argv;
var arm = require('./arm.js');
var i = 0;
var signal = {
	base: input[2],
	shoulderL: input[3],
	shoulderR: input[4],
	elbow: input[5],
	wrist: input[6],
	speed: input[7]
};
var signal1 = {
	base: 360,
	shoulderL: 360,
	shoulderR: 360,
	elbow: 360,
	wrist: 360,
	speed: 40
};
var signal2 = {
	base: 0,
	shoulderL: 0,
	shoulderR: 0,
	elbow: 0,
	wrist: 0,
	speed: 40
};
// while(i < 100){
// 	arm.prototype.handle(input[2]);
// 	i++;
// }
// setTimeout(function(){
// 	console.log("armInit end")
// }, 2000);
setInterval(function(){
	 // arm.prototype.handle(signal);
	if(i == 0){
		arm.prototype.handle(signal1);
		i = 1;
	}
	else if(i ==1){
		arm.prototype.handle(signal2);
		i = 0;
	}
// }, 50);
}, 2000);
// }, 10000);
