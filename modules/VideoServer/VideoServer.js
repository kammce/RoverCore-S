"use strict";

var Neuron = require('../Neuron');
var MjpegCamera = require('mjpeg-camera');

/*

cvlc -I dummy v4l2:// :v4l2-dev=/dev/video-tracker :v4l2-width=1280 :v4l2-height=720 --live-caching=0 --sout-transcode-threads 8 --network-caching=0 ':sout=#transcode{vcodec=MJPG,fps=15}:standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:9001}}'

cvlc -I dummy v4l2:// :v4l2-dev=/dev/video-tracker :v4l2-width=640 :v4l2-height=360 --live-caching=0 --sout-transcode-threads 8 --network-caching=0 ':sout=#transcode{vcodec=MJPG,fps=15}:standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:9001}}'

cvlc -I dummy http://localhost:9001 --live-caching=0 --network-caching=0 ':sout=#standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:9002}}'

*/

class VideoServer extends Neuron
{
	constructor(util)
	{
		// =====================================
		// Bootstrapping Section (DO NOT CHANGE)
		// =====================================
		//// Calls parent class constructor
		super(util);
		////Assigns class's name
		this.name = util.name;
		/**
		 * Feedback mechanism for sending information back to mission control.
		 * Usage:
		 *		this.feedback(msg_to_output, ...);
		 * 		this.feedback("HELLO WORLD", { foo: "bar" });
		 */
		this.feedback = util.feedback;
		/**
		 * Abstraction library for printing to standard out in color as well
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.log.output(msg_to_output, ...);
		 *		this.log.output("HELLO WORLD", { foo: "bar" });
		 */
		this.log = util.log;
		this.log.setColor("yellow");
		/**
		 * This variable specifies the amount of time between react() calls before the
		 * idle() routine is called and the module state is moved to IDLING
		 */
		this.idle_timeout = 2000;
		/**
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.model.registerMemory("Proto");
		 *		this.model.set("Proto", {
		 *		    proto: 555
		 *		});
		 *		var proto = this.model.get("Proto");
		 */
		this.model = util.model;
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		// =====================================
		// Construct Class After This Points
		// =====================================
		this.spawn = require("child_process").spawn;
		this.exec = require("child_process").exec;
		this.fs = require('fs');

		this.port = "3-1.2";

		this.video = undefined;
		//this.killAllVideoServers();
		this.model.registerMemory("VideoServer");

		this.local = {
			restart_counter: 0,
			snapshots: 0
		};

		this.boundary = "--7b3cc56e5f51db803f790dad720ed50a";
		this.video_source = "/dev/video-tracker";
		// this.video_source = "/dev/video0";

		this.model.set("VideoServer", this.local);
		//// Create an MjpegCamera instance
		this.camera = new MjpegCamera({
			url: 'http://localhost:9001',
			motion: true
		});

		//// killall vlc instances
		this.exec("killall vlc");
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
		switch(input["mode"])
		{
			case "start":
				this.startVideoServer();
				break;
			case "stop":
				this.stopVideoServer();
				break;
			case "kill":
				this.killAllVideoServers();
				break;
			case "unbind":
				this.unbind();
				break;
			case "bind":
				this.bind();
				break;
			case "zoom":
				this.setZoom(input["zoom"]);
				break;
			case "snapshot":
				this.generateSnapshot();
				break;
			default:
				break;
		}
		return true;
	}
	/**
     * Cortex will attempt to halt this lobe in the following situations:
	 *		1. If the Mission Control controller of a lobe disconnects from the rover server or server proxy.
	 *		2. If the Mission Control controller sends a manual halt signal to Cortex to halt the lobe.
	 *		3. If another lobe uses an UPCALL to trigger the halt of a specific lobe or all lobes.
     * @returns {boolean} returns true if successful, returns false if halt failed.
     */
	halt()
	{
		this.log.output(`HALTING ${this.name}`);
		this.feedback(`HALTING ${this.name}`);
		return true;
	}
	/**
     * Cortex will attempt to resume this lobe in the following situations:
	 *		1. If the Mission Control controller sends a manual resume signal to Cortex to resume a halted lobe.
	 *		2. If another lobe uses an UPCALL to trigger resume of a specific lobe or all lobes.
     * @returns {boolean} returns true if successful, returns false if resume failed.
     */
	resume()
	{
		this.log.output(`RESUMING ${this.name}`);
		this.feedback(`RESUMING ${this.name}`);
		return true;
	}
	/**
     * Cortex will attempt to IDLE your lobes if this lobe does not receive a command from mission control in the specified amount defined in the this.idle_timeout. file. This is useful for lobes that need period commands from mission control. Lobes are put into IDLING state ~100ms after they are constructed.
     * @returns {boolean} returns true if successful, returns false if idle failed.
     */
	idle()
	{
		this.log.output(`IDLING ${this.name}`);
		this.feedback(`IDLING ${this.name}`);
		return true;
	}
	setZoom(zoom)
	{
		//zoom = zoom || 0;
		zoom = (0 <= zoom && zoom <= 43) ? zoom : 0;
		this.exec(`./install/See3CAMx10-CL/camera-control optical-zoom ${zoom}`);
	}
	isVideoServerOn()
	{
		if(typeof this.video === "undefined")
		{
			return false;
		}
		else
		{
			return true;
		}
	}
	startVideoServer()
	{
		this.video = this.spawn('vlc-wrapper',
		[
			'-I', ' dummy',
			'v4l2://',
			`:v4l2-dev=${this.video_source}`,
			':v4l2-width=640',
			':v4l2-height=360',
			'--live-caching=0',
			'--network-caching=0',
			'--sout-transcode-threads', '8',
			`:sout=#transcode{vcodec=MJPG,fps=15}:standard{access=http{mime=multipart/x-mixed-replace;boundary=${this.boundary}},mux=mpjpeg,dst=:9001}}`
		]);

		this.video.stdout.on('data', (data) =>
		{
			this.log.debug3(data.toString());
		});
		this.video.stderr.on('data', (data) =>
		{
			this.log.debug3(data.toString());
		});
		this.video.on('close', (code) =>
		{
			var msg = `VIDEO CLOSED WITH CODE ${code}`;
			this.log.output(msg);
			this.feedback(msg);
		});

		this.local["restart_counter"]++;

		this.model.set("VideoServer", this.local);
	}
	stopVideoServer()
	{
		if(this.isVideoServerOn())
		{
			this.video.kill();
			this.video = undefined;
		}
		else
		{
			var msg = "Video Server is already off";
			this.log.debug1(msg);
			this.feedback(msg);
		}
	}
	killAllVideoServers()
	{
		this.video = undefined;
		this.exec('killall vlc', (err) =>
		{
			if(err)
			{
				this.log.debug1(err);
				this.feedback(err);
				return;
			}
			var msg = "ATTEMPTING TO KILL ALL INSTANCES OF VLC.";
			this.log.debug1(msg);
			this.feedback(msg);
		});
	}
	unbind()
	{
		this.exec(`echo ${this.port} > /sys/bus/usb/drivers/usb/unbind`, (err) =>
		{
			if(err)
			{
				this.log.debug1(err);
				this.feedback(err);
				return;
			}
			var msg = "ATTEMPTING TO UNBIND CAMERA.";
			this.log.debug1(msg);
			this.feedback(msg);
		});
	}
	bind()
	{
		this.exec(`echo ${this.port} > /sys/bus/usb/drivers/usb/bind`, (err) =>
		{
			if(err)
			{
				this.log.debug1(err);
				this.feedback(err);
				return;
			}
			var msg = "ATTEMPTING TO UNBIND CAMERA.";
			this.log.debug1(msg);
			this.feedback(msg);
		});
	}
	generateSnapshot()
	{
		this.camera.getScreenshot((err, frame) =>
		{
			if(err)
			{
				this.feedback("COULD NOT GET CAMERA SNAPSHOT :", err);
			}
			else
			{
				this.fs.writeFile('./modules/VideoServer/snapshot.jpg', frame, () =>
				{
					++this.local.snapshots;
					this.model.set(this.local);
				});
			}
		});
	}
}

module.exports = VideoServer;