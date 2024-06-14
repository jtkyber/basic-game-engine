import { Vec3 } from 'wgpu-matrix';
import { lightCount } from '../objectList';
import shader from './shaders/lightDebugShader.wgsl';

export class lightFrustums {
	device: GPUDevice;
	format: GPUTextureFormat;
	depthStencilState: GPUDepthStencilState;
	inverseLightViewProjBuffer: GPUBuffer;
	uniformBuffer: GPUBuffer;
	shaderModule: GPUShaderModule;
	bindGroup: GPUBindGroup;
	pipeline: GPURenderPipeline;

	constructor(
		device: GPUDevice,
		format: GPUTextureFormat,
		depthStencilState: GPUDepthStencilState,
		inverseLightViewProjBuffer: GPUBuffer,
		uniformBuffer: GPUBuffer
	) {
		this.device = device;
		this.format = format;
		this.depthStencilState = depthStencilState;
		this.inverseLightViewProjBuffer = inverseLightViewProjBuffer;
		this.uniformBuffer = uniformBuffer;
	}

	async init() {
		this.shaderModule = <GPUShaderModule>(
			this.device.createShaderModule({ label: 'Light Frustum Shader', code: shader })
		);

		const bindGroupLayout = this.device.createBindGroupLayout({
			label: 'Light Frustum BGL',
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.VERTEX,
					buffer: {},
				},
			],
		});

		this.bindGroup = this.device.createBindGroup({
			label: 'Light Frustum Bind Group',
			layout: bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.inverseLightViewProjBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: this.uniformBuffer,
					},
				},
			],
		});

		this.pipeline = this.device.createRenderPipeline({
			label: 'Light Frustum Layout',
			layout: this.device.createPipelineLayout({
				bindGroupLayouts: [bindGroupLayout],
			}),
			vertex: {
				module: this.shaderModule,
				entryPoint: 'v_main',
			},
			fragment: {
				module: this.shaderModule,
				entryPoint: 'f_main',
				targets: [
					{
						format: this.format,
					},
				],
			},
			primitive: {
				topology: 'line-list',
			},
			depthStencil: this.depthStencilState,
		});
	}
}
