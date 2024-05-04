import { Mat4 } from 'wgpu-matrix';

export interface RenderData {
	viewTransform: Mat4;
	modelTransforms: Float32Array;
	boundingBoxTransforms: Float32Array;
	lightTransforms: Float32Array;
	lightViewProjMatrix: Float32Array;
	rotatedLightDir: Float32Array;
}

export enum LightType {
	spot,
	point,
}

export type LightTypeString = keyof typeof LightType;
