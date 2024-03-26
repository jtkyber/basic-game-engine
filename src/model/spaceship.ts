import { Mat4, Vec3, mat4, vec3 } from 'wgpu-matrix';
import { degToRad, vecAdd } from '../utils/math_stuff';
import { Model } from './model';

export class Spaceship extends Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;
	moveVector: Vec3;

	constructor(position: Vec3, eulers: Vec3) {
		super(position, eulers);
		this.moveVector = [0, 0.01, 0];
	}

	update() {
		this.model = mat4.create();
		// v: the vector you are translating by
		mat4.translation(this.position, this.model);
		// this.position[1] += this.moveVector[1] * window.myLib.deltaTime;
		// axis: the axis you are rotating around
		// angleInRadians: The angle you are rotating by
		mat4.rotateZ(this.model, degToRad(90), this.model);
		// Need to translate before rotating in WebGPU
		// even though logically it should be the other way around
	}
}
