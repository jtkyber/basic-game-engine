import { Mat4, Vec3, mat4 } from 'wgpu-matrix';
import { degToRad } from '../utils/math_stuff';
import { Model } from './model';

export class Sphere extends Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;

	constructor(position: Vec3, eulers: Vec3) {
		super(position, eulers);
	}

	update() {
		this.eulers[2] += 0.5;
		this.model = mat4.create();
		mat4.translation(this.position, this.model);
		mat4.rotateX(this.model, degToRad(this.eulers[0]), this.model);
		mat4.rotateY(this.model, degToRad(this.eulers[1]), this.model);
		mat4.rotateZ(this.model, degToRad(this.eulers[2]), this.model);
	}
}
