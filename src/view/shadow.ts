import { lightCount } from '../objectList';
import vertexShadowShader from './shaders/shadowVert.wgsl';

export class Shadow {
	device: GPUDevice;
	shadowVertShader: GPUShaderModule;
	depthTexture: GPUTexture;
	depthSampler: GPUSampler;
	depthTextureSize: number;
	depthTextureView: GPUTextureView;
	depthTextureViewArray: GPUTextureView[];
	pipeline: GPURenderPipeline;
	bindGroupLayout: GPUBindGroupLayout;
	bindGroup: GPUBindGroup;
	modelMatrixBuffer: GPUBuffer;
	lightViewProjBuffer: GPUBuffer;

	constructor(device: GPUDevice, modelMatrixBuffer: GPUBuffer, lightViewProjBuffer: GPUBuffer) {
		this.device = device;
		this.depthTextureSize = 1024;
		this.depthTextureViewArray = [];
		this.modelMatrixBuffer = modelMatrixBuffer;
		this.lightViewProjBuffer = lightViewProjBuffer;
	}

	async init() {
		this.shadowVertShader = <GPUShaderModule>(
			this.device.createShaderModule({ label: 'shadowVertShader', code: vertexShadowShader })
		);
		this.createTexture();
		this.createSampler();
		this.createBindGroupLayout();
		this.createBindGroup();
		this.createPipeline();
	}

	createTexture() {
		this.depthTexture = this.device.createTexture({
			label: 'shadow depth texture',
			size: [this.depthTextureSize, this.depthTextureSize, lightCount],
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
			format: 'depth24plus',
		});

		this.depthTextureView = this.depthTexture.createView({
			format: 'depth24plus',
			dimension: '2d-array',
			aspect: 'all',
			baseMipLevel: 0,
			mipLevelCount: 1,
			baseArrayLayer: 0,
			arrayLayerCount: lightCount,
		});

		for (let i: number = 0; i < lightCount; i++) {
			this.depthTextureViewArray[i] = this.depthTexture.createView({
				format: 'depth24plus',
				dimension: '2d',
				aspect: 'all',
				baseMipLevel: 0,
				mipLevelCount: 1,
				baseArrayLayer: i,
				arrayLayerCount: 1,
			});
		}
	}

	createSampler() {
		this.depthSampler = this.device.createSampler({
			compare: 'greater',
			addressModeU: 'clamp-to-edge',
			addressModeV: 'clamp-to-edge',
			magFilter: 'linear',
			minFilter: 'linear',
		});
	}

	createBindGroupLayout() {
		this.bindGroupLayout = this.device.createBindGroupLayout({
			label: 'shadow bind group layout',
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: 'read-only-storage',
					},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: 'read-only-storage',
					},
				},
			],
		});
	}

	createBindGroup() {
		this.bindGroup = this.device.createBindGroup({
			label: 'shadow bind group',
			layout: this.bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.modelMatrixBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: this.lightViewProjBuffer,
					},
				},
			],
		});
	}

	createPipeline() {
		this.pipeline = this.device.createRenderPipeline({
			label: 'shadow pipeline',
			layout: this.device.createPipelineLayout({
				bindGroupLayouts: [this.bindGroupLayout],
			}),
			vertex: {
				module: this.shadowVertShader,
				buffers: [
					{
						arrayStride: 4 * 3,
						attributes: [
							{
								shaderLocation: 0,
								offset: 0,
								format: 'float32x3',
							},
						],
					},
				],
			},
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: 'greater',
				format: 'depth24plus',
			},
			primitive: {
				topology: 'triangle-list',
				cullMode: 'front',
			},
		});
	}
}
