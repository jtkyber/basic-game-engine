import { Mat4, Vec3 } from 'wgpu-matrix';

export class Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;

	constructor(position: Vec3, eulers: Vec3) {
		this.position = position;
		// Angle of rotation on each axis (I think)
		this.eulers = eulers;
	}

	get_model(): Mat4 {
		return this.model;
	}
}
