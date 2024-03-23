import { Mat4, Vec3, mat4 } from 'wgpu-matrix';
import { degToRad } from '../utils/math_stuff';
import { Model } from './model';

export class Player extends Model {
	position: Vec3;
	eulers: Vec3;
	model: Mat4;
	moveSpeed: number;

	constructor(position: Vec3, eulers: Vec3) {
		super(position, eulers);
		this.moveSpeed = 0.01;
	}

	update() {
		this.model = mat4.create();
		mat4.translation(this.position, this.model);
		mat4.rotateZ(this.model, degToRad(this.eulers[1]), this.model);
	}
}
