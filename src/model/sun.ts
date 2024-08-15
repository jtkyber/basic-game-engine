import { Mat4, Vec3, mat4, vec3 } from 'wgpu-matrix';
import { Model } from './model';

export class Sun extends Model {
	untransformedPosition: Vec3;
	position: Vec3;
	eulers: Vec3;
	model: Mat4;

	constructor(position: Vec3, eulers: Vec3) {
		super(position, eulers);
	}

	update() {
		this.eulers[1] = 0.01;
		vec3.rotateY(this.untransformedPosition, [0, 0, 0], this.eulers[1], this.untransformedPosition);
		this.model = mat4.create();
		mat4.translation(this.position, this.model);
	}
}
