import { Mat4, Vec3 } from 'wgpu-matrix';

export class Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;
	gravitySpd: number;
	gravityAcc: number;
	moveVector: Vec3;

	constructor(position: Vec3, eulers: Vec3) {
		this.position = position;
		// Angle of rotation on each axis (I think)
		this.eulers = eulers;
		this.gravitySpd = 1;
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
		this.gravityAcc = 0.01;
	}

	apply_gravity() {
		this.gravityAcc += 0.01;
		this.position[2] -= this.gravitySpd * this.gravityAcc;
		if (this.position[2] < 0) {
			this.position[2] = 0;
			this.reset_gravity();
		}
	}
}
