function broadcast(streamArray){ //this function to broadcast "Ready" query
	for(var i = 0; i < streamArray.length; i++){ //assuming 4 total modules
		streamArray[i].write('Ready?');
	}
}

module.exports = broadcast;