"use strict";

class Model
{
	/*
		structure = {
			"<registered key>": {
				timestamp: <long int>
				value: <any data type>
			},
			...
		}
	*/
	constructor(feedback)
	{
		// unit is milliseconds
		this.feedback = feedback;
		this.epoch = this.currentTime();
		this.database = {};
	}
	currentTime()
	{
		return ((new Date()).getTime());
	}
	registerMemory(key)
	{
		this.database[key] = {
			timestamp: this.currentTime(),
			value: null
		};
		return true;
	}
	set(key, value)
	{
		if (this.database.hasOwnProperty(key))
		{
			this.database[key] = {
				timestamp: this.currentTime(),
				value
			};

			var realtime_reply = {
				key
			};

			realtime_reply[key] = this.database[key];

			this.feedback(realtime_reply);
			return true;
		}
		else
		{
			return false;
		}
	}
	get(key)
	{
		if (key in this.database)
		{
			return this.database[key]["value"];
		}
		else
		{
			return false;
		}
	}
	getMemory(timestamp)
	{
		if (!timestamp || timestamp === 0)
		{
			return this.database;
		}
		else
		{
			var latest_database = {};
			for (var memory in this.database)
			{
				if (this.database[memory]["timestamp"] >= timestamp)
				{
					//// copy memory to latest_database
					latest_database[memory] = this.database[memory];
				}
			}
			return latest_database;
		}
	}
}

module.exports = Model;
