"use strict";

class pidController {
	
	constructor(Kp, Ki, Kd, dt) {
		this.Kp = Kp;
		this.Ki = Ki;
		this.Kd = Kd;
		this.dt = dt;
		this.target = 0;
		//this.output = 0;
		this.current = 0;
		this.err = 0;
		this.err0 = 0;
		this.errSum = 0;
		this.errDiff = 0;	

		this.output = 0;
		this.weight = .2;
	}

	setTarget(value) {
		this.target = value;
	}

	update(current, target) {
		/*
		this.current = current;
		this.target = target;

		this.err0 = this.err;
		this.err = this.target - this.current;
		this.errSum = (this.errSum + this.err)*this.dt;
		this.errDiff = (this.err - this.err0)/this.dt;

		if(this.errSum > 1) {
			this.errSum = 1;
		} else if(this.errSum < -1) {
			this.errSum = -1;
		}

		return (this.Kp * this.err) + (this.Ki * this.errSum) + (this.Kd*this.errDiff);
		*/
		this.output = this.weight*target+(1-this.weight)*this.output;		
		return this.output;
	}

	setPID(Kp, Ki, Kd) {
		this.Kp = Kp;
		this.Ki = Ki;
		this.Kd = Kd;				
	}
}

module.exports = pidController;
