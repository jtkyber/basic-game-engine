import { Mat4, Vec3, mat4 } from 'wgpu-matrix';
import { Model } from './model';

export class Tree extends Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;

	constructor(position: Vec3, eulers: Vec3) {
		super(position, eulers);
	}

	update() {
		this.model = mat4.create();
		mat4.translation(this.position, this.model);
	}
}
