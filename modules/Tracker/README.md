##Tracker System README

#Description
The input is to be a JSON object with the following definition
	
		var Tracker_Object = {
			command: [String],
			val: [Object]
		}
#List of commands

Points camera at desired angle, using rover as reference frame

		{
		command: "moveAngleLocal",
		val: {
			yaw: [Integer],
			pitch: [Integer]
			}
		}
		
Moves camera by specified amount

		{
		command: "moveInterval",
		val: {
			yaw: [Integer],
			pitch: [Integer],
			stabilizeYaw: [Bool],//True uses global reference frame when moving
			stabilizePitch: [bool]
			}
		}
Sets default position of camera

		{ 
		command: "defaultConfig",
		val: {
			yaw: [Integer],
			pitch: [Integer]
			}
		}
Moves to default position

		{
		command: "recalibrate"
		}
Reads data from LIDAR

		{
		command: "getDistance"
		}
	
