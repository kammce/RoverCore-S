"use strict";

var Neuron = require('../Neuron');

class Arm extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        // Construct Class here

    }
    react(input) {
        /*
        The input is to be an object with the following definition:
            var ArmObject = {
                cmdtype: [String],
                cmdval: [Object]
            }
        Notes:
            1.> (String) cmdtype
                "The string containing the command type"
                    Options:
                    "Moves": Specifies a movement command
                    "Tools": Specifies an endeffector tool command
                    "Power": Specifies an Arm power on/off command (Q: Is this needed?)
            2.> (Object) cmdval
                "The object containing the parameters for the cmdtype specified; parameters vary depending on command type"
                    a.> cmdtype "Moves"
                        Members:
                        (int) x: Specifies the x-coordinate of the target in reference to the rover
                        (int) y: Specifies the y-coordinate of the target in reference to the rover
                        (int) z: Specifies the z-coordinate of the target in reference to the rover
                    b.> cmdtype "Tools"
                        Members:
                        (String) tsc: Specifies which Tool System Command is to be run
                            Options:
                            "Switch": Specifies a tool switch command


        */
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(this.name ,`REACTING ${this.name}: `, input);
    }
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(this.name ,`HALTING ${this.name}`);
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(this.name ,`RESUMING ${this.name}`);
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(this.name ,`IDLING ${this.name}`);
    }
}

module.exports = Arm;