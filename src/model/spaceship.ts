import { Mat4, Vec3, mat4, vec3 } from 'wgpu-matrix';
import { degToRad } from '../utils/math_stuff';
import { Model } from './model';

export class Spaceship extends Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;

	constructor(position: Vec3, eulers: Vec3) {
		super(position, eulers);
	}

	update() {
		this.model = mat4.create();
		// v: the vector you are translating by
		mat4.translation(this.position, this.model);
		// axis: the axis you are rotating around
		// angleInRadians: The angle you are rotating by
		mat4.rotateZ(this.model, degToRad(90), this.model);
		// Need to translate before rotating in WebGPU
		// even though logically it should be the other way around
	}
}
