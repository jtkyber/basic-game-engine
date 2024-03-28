import { Vec3 } from 'wgpu-matrix';

export interface ICollision {
	planeNormal: Vec3;
	playerBoxZdelta: number;
}

declare global {
	interface Window {
		myLib: {
			deltaTime: number;
		};
	}
}
