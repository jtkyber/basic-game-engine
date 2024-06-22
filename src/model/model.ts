import { Mat4, Vec3, mat4 } from 'wgpu-matrix';

export class Model {
	position: Vec3;
	untransformedPosition: Vec3;
	eulers: Vec3;
	model: Mat4;
	gravitySpd: number;
	gravityInc: number;
	gravityAcc: number;
	moveVector: Vec3;

	constructor(position: Vec3, eulers: Vec3) {
		this.position = position;
		this.untransformedPosition = position;
		// Angle of rotation on each axis (I think)
		this.eulers = eulers;
		this.gravitySpd = 0.01;
		this.gravityInc = 0.005;
		this.gravityAcc = 0.005;
		this.moveVector = [0, 0, 0];
	}

	update() {}

	get_model(): Mat4 {
		return this.model;
	}

	set_rotation(rot: number, i: number): void {
		this.eulers[i] = rot;
	}

	reset_gravity() {
		this.gravityAcc = 0.005;
	}

	apply_gravity() {
		this.gravityAcc += this.gravityInc * window.myLib.deltaTime;
		this.position[2] -= this.gravitySpd * this.gravityAcc * window.myLib.deltaTime;
		if (this.position[2] < 0) {
			this.position[2] = 0;
			this.reset_gravity();
		}
	}
}
