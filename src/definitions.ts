import { Mat4 } from 'wgpu-matrix';

export interface RenderData {
	viewTransform: Mat4;
	modelTransforms: Float32Array;
	boundingBoxTransforms: Float32Array;
}
