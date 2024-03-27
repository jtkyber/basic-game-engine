import { Vec3, mat4 } from 'wgpu-matrix';
import { RenderData } from '../definitions';
import { degToRad } from '../utils/math_stuff';
import { Material } from './material';
import { ObjMesh } from './obj_mesh';
import { IObject, IObjectData } from './objects';
import boundingBoxShader from './shaders/boundingBoxShader.wgsl';
import shader from './shaders/shader.wgsl';
import { TriangleMesh } from './triangle_mesh';

export class Renderer {
	// Objects
	objectData: IObjectData;
	objectNames: string[];
	collisionDebug: boolean;

	// Canvas Stuff
	canvas: HTMLCanvasElement;
	context: GPUCanvasContext;
	view: GPUTextureView;

	// GPU Device Stuff
	adapter: GPUAdapter;
	device: GPUDevice;
	format: GPUTextureFormat;

	// Shaders
	shaderModule: GPUShaderModule;
	boundingBoxShaderModule: GPUShaderModule;

	// Pipeline Stuff
	uniformBuffer: GPUBuffer;
	objectBuffer: GPUBuffer;
	boundingBoxBuffer: GPUBuffer;
	playerPosBuffer: GPUBuffer;
	vpDimensionBuffer: GPUBuffer;

	frameBindGroupLayout: GPUBindGroupLayout;
	boundingBoxBindGroupLayout: GPUBindGroupLayout;
	materialBindGroupLayout: GPUBindGroupLayout;

	frameBindGroup: GPUBindGroup;
	boundingBoxBindGroup: GPUBindGroup;

	pipeline: GPURenderPipeline;
	boundingBoxPipeline: GPURenderPipeline;

	// Rendering Stuff
	encoder: GPUCommandEncoder;
	renderPass: GPURenderPassEncoder;

	// Meshes
	triangleMesh: TriangleMesh;
	objectMeshes: ObjMesh[];

	// Materials
	quadMaterial: Material;
	objectMaterials: Material[];

	// Projection Matrix Stuff
	fov: number;
	aspect: number;

	// Depth Stencil Stuff
	depthStencilState: GPUDepthStencilState;
	depthStencilBuffer: GPUTexture;
	depthView: GPUTextureView;
	depthStencilView: GPUTextureView;
	depthStencilAttachment: GPURenderPassDepthStencilAttachment;

	constructor(
		canvas: HTMLCanvasElement,
		objectData: IObjectData,
		objectNames: string[],
		collisionDebug: boolean
	) {
		this.objectData = objectData;
		this.objectNames = objectNames;
		this.collisionDebug = collisionDebug;
		this.canvas = canvas;
		this.context = <GPUCanvasContext>canvas.getContext('webgpu');
		this.fov = degToRad(60);
		this.aspect = this.canvas.width / this.canvas.height;
		this.objectMeshes = [];
		this.objectMaterials = [];
	}

	async initialize() {
		await this.setupDevice();
		await this.makeBindGroupLayouts();
		await this.makeDepthBufferResources();
		await this.createAssets();
		await this.makePipelines();
		await this.makeBindGroup();
	}

	async setupDevice() {
		this.adapter = <GPUAdapter>await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
		this.device = <GPUDevice>await this.adapter.requestDevice();
		this.format = <GPUTextureFormat>navigator.gpu.getPreferredCanvasFormat();
		this.shaderModule = <GPUShaderModule>this.device.createShaderModule({ label: 'shader', code: shader });
		this.boundingBoxShaderModule = <GPUShaderModule>(
			this.device.createShaderModule({ label: 'bounding box shader', code: boundingBoxShader })
		);
		this.context.configure({
			device: this.device,
			format: this.format,
			alphaMode: 'premultiplied',
		});
	}

	async createAssets() {
		this.uniformBuffer = this.device.createBuffer({
			// values in a 4x4 matrix * bytes per value * # of matrices
			size: 16 * 4 * 2,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.objectBuffer = this.device.createBuffer({
			// values in a 4x4 matrix * bytes per value * # of matrices
			size: 4 * (16 * this.objectNames.length),
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.playerPosBuffer = this.device.createBuffer({
			size: 4 * 3,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.vpDimensionBuffer = this.device.createBuffer({
			size: 4 * 2,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		if (this.collisionDebug) {
			this.boundingBoxBuffer = this.device.createBuffer({
				// values in a 4x4 matrix * bytes per value * # of matrices
				label: 'bounding box buffer',
				size: 4 * 16 * 3,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
		}

		this.triangleMesh = new TriangleMesh(this.device);

		for (let i: number = 0; i < this.objectNames.length; i++) {
			const modelName = this.objectNames[i];
			const object: IObject = this.objectData[modelName];

			this.objectMeshes[i] = new ObjMesh(this.device);
			console.log(i, `Parsing ${modelName} object`);
			await this.objectMeshes[i].initialize(`dist/models/${modelName}/${modelName}`);
			this.objectMeshes[i].set_model_name(modelName);

			if (object.hasBoundingBox) {
				console.log(i, `Parsing ${modelName} bounding box`);
				await this.objectMeshes[i].generate_bounding_boxes(`dist/boundingBoxes/${modelName}_b.obj`);
			}

			this.objectMaterials[i] = new Material();
			await this.objectMaterials[i].initialize(
				this.device,
				this.objectMeshes[i].materialFilenames,
				this.materialBindGroupLayout,
				this.depthView
			);
		}
	}
	async makeDepthBufferResources() {
		this.depthStencilState = {
			format: 'depth24plus',
			depthWriteEnabled: true,
			depthCompare: 'less',
		};

		const size: GPUExtent3D = {
			width: this.canvas.width,
			height: this.canvas.height,
			depthOrArrayLayers: 1,
		};
		this.depthStencilBuffer = this.device.createTexture({
			size: size,
			format: 'depth24plus',
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		});

		const depthBuffer = this.device.createTexture({
			size: size,
			format: 'depth24plus',
			usage: GPUTextureUsage.TEXTURE_BINDING,
			mipLevelCount: 1,
			sampleCount: 1,
		});

		this.depthStencilView = this.depthStencilBuffer.createView({
			format: 'depth24plus',
			dimension: '2d',
			aspect: 'depth-only',
		});
		this.depthView = depthBuffer.createView({
			format: 'depth24plus',
			dimension: '2d',
			aspect: 'depth-only',
		});

		this.depthStencilAttachment = {
			view: this.depthStencilView,
			depthClearValue: 1.0,
			depthLoadOp: 'clear',
			depthStoreOp: 'store',
		};
	}

	async makeBindGroupLayouts() {
		this.frameBindGroupLayout = <GPUBindGroupLayout>this.device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 2,
					visibility: GPUShaderStage.VERTEX,
					buffer: {},
				},
				{
					binding: 3,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {},
				},
			],
		});

		if (this.collisionDebug) {
			this.boundingBoxBindGroupLayout = <GPUBindGroupLayout>this.device.createBindGroupLayout({
				label: 'bounding box bind group layout',
				entries: [
					{
						binding: 0,
						visibility: GPUShaderStage.VERTEX,
						buffer: {},
					},
					{
						binding: 1,
						visibility: GPUShaderStage.VERTEX,
						buffer: {
							type: 'read-only-storage',
							hasDynamicOffset: false,
						},
					},
				],
			});
		}

		this.materialBindGroupLayout = <GPUBindGroupLayout>this.device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.FRAGMENT,
					texture: {
						viewDimension: '2d-array',
					},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.FRAGMENT,
					sampler: {},
				},
				{
					binding: 2,
					visibility: GPUShaderStage.FRAGMENT,
					texture: {
						sampleType: 'depth',
						viewDimension: '2d',
						multisampled: false,
					},
				},
				{
					binding: 3,
					visibility: GPUShaderStage.FRAGMENT,
					sampler: {
						type: 'comparison',
					},
				},
			],
		});
	}

	async makeBindGroup() {
		this.frameBindGroup = this.device.createBindGroup({
			layout: this.frameBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.uniformBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: this.objectBuffer,
					},
				},
				{
					binding: 2,
					resource: {
						buffer: this.playerPosBuffer,
					},
				},
				{
					binding: 3,
					resource: {
						buffer: this.vpDimensionBuffer,
					},
				},
			],
		});

		if (this.collisionDebug) {
			this.boundingBoxBindGroup = this.device.createBindGroup({
				label: 'bounding box bing group',
				layout: this.boundingBoxBindGroupLayout,
				entries: [
					{
						binding: 0,
						resource: {
							buffer: this.uniformBuffer,
						},
					},
					{
						binding: 1,
						resource: {
							buffer: this.boundingBoxBuffer,
						},
					},
				],
			});
		}
	}

	makePipelines() {
		this.pipeline = <GPURenderPipeline>this.device.createRenderPipeline({
			layout: this.device.createPipelineLayout({
				bindGroupLayouts: [this.frameBindGroupLayout, this.materialBindGroupLayout],
			}),
			vertex: {
				module: this.shaderModule,
				entryPoint: 'v_main',
				// Same buffer layout for all object types
				buffers: [this.objectMeshes[0].bufferLayout],
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
				topology: this.collisionDebug ? 'line-list' : 'triangle-list',
			},
			depthStencil: this.depthStencilState,
		});

		if (this.collisionDebug) {
			this.boundingBoxPipeline = <GPURenderPipeline>this.device.createRenderPipeline({
				label: 'bounding box pipeline',
				layout: this.device.createPipelineLayout({
					bindGroupLayouts: [this.boundingBoxBindGroupLayout],
				}),
				vertex: {
					module: this.boundingBoxShaderModule,
					entryPoint: 'v_main',
					buffers: [
						{
							arrayStride: 12,
							attributes: [
								{
									shaderLocation: 0,
									format: 'float32x3',
									offset: 0,
								},
							],
						},
					],
				},
				fragment: {
					module: this.boundingBoxShaderModule,
					entryPoint: 'f_main',
					targets: [
						{
							format: this.format,
							blend: {
								color: {
									srcFactor: 'one',
									dstFactor: 'one-minus-src-alpha',
								},
								alpha: {
									srcFactor: 'one',
									dstFactor: 'one-minus-src-alpha',
								},
							},
						},
					],
				},
				primitive: {
					topology: 'triangle-list',
				},
				depthStencil: this.depthStencilState,
			});
		}
	}

	render = (renderables: RenderData, cameraPosition: Vec3) => {
		// If zFar (last v + alue) is too large, depth buffer gets confused
		const projection = mat4.perspective(this.fov, this.aspect, 0.1, 50);
		const view = renderables.viewTransform;

		// Pass matrices into the same buffer
		// Shader will take it in as an object with 3 matrices because of the way we set it up
		this.device.queue.writeBuffer(
			this.objectBuffer,
			0,
			<ArrayBuffer>renderables.modelTransforms,
			0,
			renderables.modelTransforms.length
		);

		if (this.collisionDebug) {
			this.device.queue.writeBuffer(
				this.boundingBoxBuffer,
				0,
				<ArrayBuffer>renderables.boundingBoxTransforms,
				0,
				renderables.boundingBoxTransforms.length
			);
		}

		this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
		this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>projection);

		this.device.queue.writeBuffer(this.playerPosBuffer, 0, <ArrayBuffer>new Float32Array(cameraPosition));
		this.device.queue.writeBuffer(
			this.vpDimensionBuffer,
			0,
			<ArrayBuffer>new Float32Array([this.canvas.width, this.canvas.height])
		);

		this.encoder = <GPUCommandEncoder>this.device.createCommandEncoder();
		this.view = <GPUTextureView>this.context.getCurrentTexture().createView();
		this.renderPass = <GPURenderPassEncoder>this.encoder.beginRenderPass({
			colorAttachments: [
				{
					view: this.view,
					loadOp: 'clear',
					clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
					storeOp: 'store',
				},
			],
			depthStencilAttachment: this.depthStencilAttachment,
		});

		this.renderPass.setPipeline(this.pipeline);
		this.renderPass.setBindGroup(0, this.frameBindGroup);

		let objectsDrawn: number = 0;

		// Models
		for (let i: number = 0; i < this.objectNames.length; i++) {
			this.renderPass.setVertexBuffer(0, this.objectMeshes[i].buffer);
			this.renderPass.setBindGroup(1, this.objectMaterials[i].bindGroup);
			this.renderPass.draw(this.objectMeshes[i].vertexCount, 1, 0, objectsDrawn);
			objectsDrawn++;
		}

		if (this.collisionDebug) {
			this.renderPass.setPipeline(this.boundingBoxPipeline);
			this.renderPass.setBindGroup(0, this.boundingBoxBindGroup);

			// Bounding Boxes
			let b_index: number = 0;
			for (let i: number = 0; i < this.objectNames.length; i++) {
				const modelName: string = this.objectNames[i];
				const object: IObject = this.objectData[modelName];

				if (object.hasBoundingBox) {
					this.renderPass.setVertexBuffer(0, this.objectMeshes[i].boundingBoxBuffer);
					this.renderPass.draw(this.objectMeshes[i].boundingBoxVertexCount, 1, 0, b_index);
					b_index++;
				}
			}
		}

		this.renderPass.end();
		this.device.queue.submit([this.encoder.finish()]);
	};
}
