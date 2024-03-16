import { Mat4, Vec3, mat4 } from 'wgpu-matrix';

export class Quad {
	position: Vec3;
	model: Mat4;

	constructor(position: Vec3) {
		this.position = position;
	}

	update() {
		this.model = mat4.create();
		// v: the vector you are translating by
		mat4.translation(this.position, this.model);
	}

	get_model(): Mat4 {
		return this.model;
	}
}
