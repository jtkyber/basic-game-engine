import { Mat4, Vec3, mat4, vec3 } from 'wgpu-matrix';
import { degToRad } from '../math_stuff';
import { Model } from './model';

export class Spaceship extends Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;

	constructor(position: Vec3, eulers: Vec3) {
		super(position, eulers);
	}

	update() {
		this.eulers[1] += 0.005;
		this.eulers[1] %= 360;

		this.model = mat4.create();
		// v: the vector you are translating by
		this.position = vec3.addScaled(this.position, [0, 1, 0], 0.05);
		mat4.translation(this.position, this.model);
		// axis: the axis you are rotating around
		// angleInRadians: The angle you are rotating by
		// mat4.scale(this.model, [0.1, 0.1, 0.1], this.model);
		// mat4.rotateX(this.model, degToRad(90), this.model);
		// mat4.rotateY(this.model, this.eulers[1], this.model);
		mat4.rotateZ(this.model, degToRad(90), this.model);
		// Need to translate before rotating in WebGPU
		// even though logically it should be the other way around
	}
}
