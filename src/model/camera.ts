import { Mat4, Vec3, mat4, vec3 } from 'wgpu-matrix';
import { degToRad } from '../utils/math_stuff';

export class Camera {
	position: Vec3;
	eulers: Vec3;
	view: Mat4;
	forwards: Vec3;
	forwardMove: Vec3;
	right: Vec3;
	rightMove: Vec3;
	up: Vec3;

	constructor(position: Vec3, theta: number, phi: number) {
		this.position = position;
		this.eulers = [0, phi, theta];
		this.forwards = vec3.create();
		this.forwardMove = vec3.create();
		this.right = vec3.create();
		this.rightMove = vec3.create();
		this.up = vec3.create();
	}

	update() {
		if (this.position[2] < 0.1) this.position[2] = 0.1;

		this.forwards = [
			Math.cos(degToRad(this.eulers[2])) * Math.cos(degToRad(this.eulers[1])),
			Math.sin(degToRad(this.eulers[2])) * Math.cos(degToRad(this.eulers[1])),
			Math.sin(degToRad(this.eulers[1])),
		];

		this.forwardMove = [Math.cos(degToRad(this.eulers[2])), Math.sin(degToRad(this.eulers[2])), 0];

		this.right = vec3.cross(this.forwards, [0, 0, 1]);
		this.rightMove = vec3.cross(this.forwardMove, [0, 0, 1]);
		vec3.normalize(this.right, this.right);

		this.up = vec3.cross(this.right, this.forwards);
		vec3.normalize(this.up, this.up);

		const target: Vec3 = vec3.add(this.position, this.forwards);

		// Eye: Position of the camera
		// Target: The point we're looking at
		// Up: The vector we are considering "up" to be at
		this.view = mat4.lookAt(this.position, target, this.up);
	}

	get_view(): Mat4 {
		return this.view;
	}

	get_position(): Vec3 {
		return this.position;
	}
}
