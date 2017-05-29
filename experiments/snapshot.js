var http = require('http');
var fs = require('fs');
var data = "";
var url = 'http://localhost:9001';
var boundary = "--7b3cc56e5f51db803f790dad720ed50a";
var request = http.request(url, function(response)
{
	var first_index = -1;
	var second_index = -1;
	response.on('data', function(chunk)
	{
		data += chunk.toString();
		//console.log(data, first_index, second_index);
		first_index = data.indexOf(boundary);
		second_index = data.indexOf(boundary, first_index+1);
		if(first_index != -1 && second_index != -1)
		{
			response.destroy();
		}
	});

	response.on('end', function()
	{
		var section = data.substring(first_index+boundary.length+2, second_index)
		section		= section.substring(section.indexOf("\n") + 1);
		section		= section.substring(section.indexOf("\n") + 1);
		section		= section.substring(section.indexOf("\n") + 1);

		fs.writeFile('snapshot.jpg', section);
	});
}).end();