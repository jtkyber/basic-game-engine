import { Mat4, Vec3, mat4, vec3 } from 'wgpu-matrix';
import { degToRad } from '../utils/math_stuff';

export class Triangle {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;

	constructor(position: Vec3, theta: number) {
		this.position = position;
		// Angle of rotation on each axis (I think)
		this.eulers = [0, 0, theta];
	}

	update(speed: number) {
		this.eulers[2] += speed;
		this.eulers[2] %= 360;

		this.model = mat4.create();
		// v: the vector you are translating by
		mat4.translation(this.position, this.model);
		// axis: the axis you are rotating around
		// angleInRadians: The angle you are rotating by
		mat4.scale(this.model, [0.6, 0.6, 0.6], this.model);
		mat4.rotateZ(this.model, degToRad(this.eulers[2]), this.model);
		// Need to translate before rotating in WebGPU
		// even though logically it should be the other way around
	}

	get_model(): Mat4 {
		return this.model;
	}
}
