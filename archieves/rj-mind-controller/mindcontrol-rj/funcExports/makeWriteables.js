var fs = require('fs');

function makeWrites(streamArray, pathArray){
	for(var i = 0; i < streamArray.length; i++){
		streamArray[i] = fs.createWriteStream(pathArray[i]);
	}
}

module.exports = makeWrites;