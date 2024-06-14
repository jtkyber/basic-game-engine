import { Mat4, Vec3, mat4, utils } from 'wgpu-matrix';
import { RenderData } from '../definitions';
import { IObject, boundingBoxCount, lightCount, objectCount, objectList } from '../objectList';
import { one_four_by_four_four } from '../utils/matrices';
import { CubeMaterial } from './cube_material';
import { lightFrustums } from './lightFrustums';
import { LightMesh } from './light_mesh';
import { Material } from './material';
import { ObjMesh } from './obj_mesh';
import boundingBoxShader from './shaders/boundingBoxShader.wgsl';
import shader from './shaders/shader.wgsl';
import skyShader from './shaders/skyShader.wgsl';
import { Shadow } from './shadow';
import { TriangleMesh } from './triangle_mesh';

export class Renderer {
	// Objects
	collisionDebug: boolean;
	lightDebug: boolean;

	// Shadow
	shadow: Shadow;
	lightFrustums: lightFrustums;

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
	skyShaderModule: GPUShaderModule;
	boundingBoxShaderModule: GPUShaderModule;

	// Pipeline Stuff
	uniformBuffer: GPUBuffer;
	objectBuffer: GPUBuffer;
	boundingBoxBuffer: GPUBuffer;
	cameraPosBuffer: GPUBuffer;
	vpDimensionBuffer: GPUBuffer;
	lightBrightnessBuffer: GPUBuffer;
	lightColorBuffer: GPUBuffer;
	lightTypeBuffer: GPUBuffer;
	lightDirectionBuffer: GPUBuffer;
	lightLimitBuffer: GPUBuffer;
	lightWorldPosBuffer: GPUBuffer;
	lightViewProjBuffer: GPUBuffer;
	inverseLightViewProjBuffer: GPUBuffer;
	normalMatrixBuffer: GPUBuffer;
	parameterBuffer: GPUBuffer;

	frameBindGroupLayout: GPUBindGroupLayout;
	skyFrameBindGroupLayout: GPUBindGroupLayout;
	boundingBoxBindGroupLayout: GPUBindGroupLayout;
	materialBindGroupLayout: GPUBindGroupLayout;

	frameBindGroup: GPUBindGroup;
	skyFrameBindGroup: GPUBindGroup;
	boundingBoxBindGroup: GPUBindGroup;

	pipeline: GPURenderPipeline;
	skyPipeline: GPURenderPipeline;
	boundingBoxPipeline: GPURenderPipeline;
	shadowPipeline: GPURenderPipeline;

	// Rendering Stuff
	encoder: GPUCommandEncoder;
	renderPass: GPURenderPassEncoder;
	shadowPass: GPURenderPassEncoder;

	// Meshes
	triangleMesh: TriangleMesh;
	objectMeshes: ObjMesh[];
	lightMesh: LightMesh;

	// Materials
	quadMaterial: Material;
	skyMaterial: CubeMaterial;
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

	constructor(canvas: HTMLCanvasElement, collisionDebug: boolean, lightDebug: boolean) {
		this.collisionDebug = collisionDebug;
		this.lightDebug = lightDebug;
		this.canvas = canvas;
		this.context = <GPUCanvasContext>canvas.getContext('webgpu');
		this.fov = utils.degToRad(60);
		this.aspect = this.canvas.width / this.canvas.height;
		this.objectMeshes = [];
		this.objectMaterials = [];
	}

	async initialize() {
		await this.makeBindGroupLayouts();
		await this.makeDepthBufferResources();
		await this.createAssets();
		this.shadow = new Shadow(this.device, this.objectBuffer, this.lightViewProjBuffer);
		this.lightFrustums = new lightFrustums(
			this.device,
			this.format,
			this.depthStencilState,
			this.inverseLightViewProjBuffer,
			this.uniformBuffer
		);
		await this.shadow.init();
		await this.lightFrustums.init();
		await this.makePipelines();
		await this.makeBindGroup();
	}

	async setupDevice() {
		this.adapter = <GPUAdapter>await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
		this.device = <GPUDevice>await this.adapter.requestDevice();
		this.format = <GPUTextureFormat>navigator.gpu.getPreferredCanvasFormat();
		this.shaderModule = <GPUShaderModule>this.device.createShaderModule({ label: 'shader', code: shader });
		this.skyShaderModule = <GPUShaderModule>(
			this.device.createShaderModule({ label: 'skyShader', code: skyShader })
		);
		this.boundingBoxShaderModule = <GPUShaderModule>(
			this.device.createShaderModule({ label: 'bounding box shader', code: boundingBoxShader })
		);

		this.context.configure({
			device: this.device,
			format: this.format,
			alphaMode: 'opaque',
		});
	}

	async initLights() {
		console.log('Parsing Light Mesh');
		this.lightMesh = new LightMesh(this.device);
		await this.lightMesh.init();
	}

	async createAssets() {
		// View and Projection matrices
		this.uniformBuffer = this.device.createBuffer({
			// values in a 4x4 matrix * bytes per value * # of matrices
			label: 'Uniform Buffer',
			size: 16 * 4 * 2,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.objectBuffer = this.device.createBuffer({
			// values in a 4x4 matrix * bytes per value * # of matrices
			label: 'Object Buffer',
			size: 4 * 16 * objectCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.lightWorldPosBuffer = this.device.createBuffer({
			label: 'lightWorldPosBuffer',
			size: 4 * 4 * this.lightMesh.lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.lightBrightnessBuffer = this.device.createBuffer({
			label: 'lightBrightnessBuffer',
			size: 4 * this.lightMesh.lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.lightColorBuffer = this.device.createBuffer({
			label: 'lightColorBuffer',
			size: 4 * 4 * this.lightMesh.lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.lightTypeBuffer = this.device.createBuffer({
			label: 'lightTypeBuffer',
			size: 4 * this.lightMesh.lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.lightDirectionBuffer = this.device.createBuffer({
			label: 'lightDirectionBuffer',
			size: 4 * 4 * this.lightMesh.lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.lightLimitBuffer = this.device.createBuffer({
			label: 'lightLimitBuffer',
			size: 4 * this.lightMesh.lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.lightViewProjBuffer = this.device.createBuffer({
			label: 'lightViewProjBuffer',
			size: 4 * 16 * lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.inverseLightViewProjBuffer = this.device.createBuffer({
			label: 'inverseLightViewProjBuffer',
			size: 4 * 16 * lightCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.normalMatrixBuffer = this.device.createBuffer({
			label: 'Normal Matrix Buffer',
			size: 4 * 16 * objectCount,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});

		this.cameraPosBuffer = this.device.createBuffer({
			label: 'CameraPos Buffer',
			size: 4 * 4,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.vpDimensionBuffer = this.device.createBuffer({
			label: 'Uniform Buffer',
			size: 4 * 2,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.parameterBuffer = this.device.createBuffer({
			label: 'Parameter Buffer',
			size: 4 * 4 * 3,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		if (this.collisionDebug) {
			this.boundingBoxBuffer = this.device.createBuffer({
				// values in a 4x4 matrix * bytes per value * # of matrices
				label: 'bounding box buffer',
				size: 4 * 16 * boundingBoxCount,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
		}

		this.triangleMesh = new TriangleMesh(this.device);

		const urls = [
			'dist/img/sky/back.png', //x+
			'dist/img/sky/front.png', //x-
			'dist/img/sky/left.png', //y+
			'dist/img/sky/right.png', //y-
			'dist/img/sky/top.png', //z+
			'dist/img/sky/bottom.png', //z-
		];
		this.skyMaterial = new CubeMaterial();
		await this.skyMaterial.initialize(this.device, urls);

		let objectTotal: number = 0;
		for (let i: number = 0; i < Object.keys(objectList).length; i++) {
			const name = Object.keys(objectList)[i];
			const object: IObject = objectList[name];
			const modelCount: number = object.models.length;

			for (let j: number = 0; j < modelCount; j++) {
				this.objectMeshes[objectTotal] = new ObjMesh(this.device);
				console.log(objectTotal, `Parsing ${name} object`);
				await this.objectMeshes[objectTotal].initialize(`dist/models/${name}/${name}`);
				this.objectMeshes[objectTotal].set_model_name(name);

				if (object.hasBoundingBox) {
					console.log(objectTotal, `Parsing ${name} bounding box`);
					await this.objectMeshes[objectTotal].generate_bounding_boxes(`dist/boundingBoxes/${name}_b.obj`);
				}

				this.objectMaterials[objectTotal] = new Material();
				await this.objectMaterials[objectTotal].initialize(
					this.device,
					this.objectMeshes[objectTotal].materialFilenames,
					this.materialBindGroupLayout
				);
				objectTotal++;
			}
		}
	}
	async makeDepthBufferResources() {
		this.depthStencilState = {
			format: 'depth32float',
			depthWriteEnabled: true,
			depthCompare: 'greater-equal',
		};

		const size: GPUExtent3D = {
			width: this.canvas.width,
			height: this.canvas.height,
			depthOrArrayLayers: 1,
		};

		this.depthStencilBuffer = this.device.createTexture({
			size: size,
			format: 'depth32float',
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		});

		this.depthStencilView = this.depthStencilBuffer.createView({
			format: 'depth32float',
			dimension: '2d',
			aspect: 'depth-only',
		});

		this.depthStencilAttachment = {
			view: this.depthStencilView,
			depthClearValue: 0.0,
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
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {},
				},
				{
					binding: 3,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {},
				},
				{
					binding: 4,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 5,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 6,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 7,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 8,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 9,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 10,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
				{
					binding: 11,
					visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
					texture: {
						sampleType: 'depth',
						viewDimension: '2d-array',
						multisampled: false,
					},
				},
				{
					binding: 12,
					visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
					sampler: {
						type: 'comparison',
					},
				},
				{
					binding: 13,
					visibility: GPUShaderStage.FRAGMENT,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
			],
		});

		this.skyFrameBindGroupLayout = <GPUBindGroupLayout>this.device.createBindGroupLayout({
			label: 'skyFrameBindGroupLayout',
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: 'uniform',
					},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.FRAGMENT,
					texture: {
						viewDimension: 'cube',
					},
				},
				{
					binding: 2,
					visibility: GPUShaderStage.FRAGMENT,
					sampler: {},
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
			],
		});
	}

	async makeBindGroup() {
		this.frameBindGroup = this.device.createBindGroup({
			label: 'Frame Bind Group',
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
						buffer: this.cameraPosBuffer,
					},
				},
				{
					binding: 3,
					resource: {
						buffer: this.vpDimensionBuffer,
					},
				},
				{
					binding: 4,
					resource: {
						buffer: this.lightBrightnessBuffer,
					},
				},
				{
					binding: 5,
					resource: {
						buffer: this.lightColorBuffer,
					},
				},
				{
					binding: 6,
					resource: {
						buffer: this.lightTypeBuffer,
					},
				},
				{
					binding: 7,
					resource: {
						buffer: this.lightDirectionBuffer,
					},
				},
				{
					binding: 8,
					resource: {
						buffer: this.lightLimitBuffer,
					},
				},
				{
					binding: 9,
					resource: {
						buffer: this.lightWorldPosBuffer,
					},
				},
				{
					binding: 10,
					resource: {
						buffer: this.normalMatrixBuffer,
					},
				},
				{
					binding: 11,
					resource: this.shadow.depthTextureView,
				},
				{
					binding: 12,
					resource: this.shadow.depthSampler,
				},
				{
					binding: 13,
					resource: {
						buffer: this.lightViewProjBuffer,
					},
				},
			],
		});

		this.skyFrameBindGroup = this.device.createBindGroup({
			label: 'skyFrameBindGroup',
			layout: this.skyFrameBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.parameterBuffer,
					},
				},
				{
					binding: 1,
					resource: this.skyMaterial.view,
				},
				{
					binding: 2,
					resource: this.skyMaterial.sampler,
				},
			],
		});

		this.device.queue.writeBuffer(
			this.lightBrightnessBuffer,
			0,
			new Float32Array(this.lightMesh.brightnessArr)
		);
		this.device.queue.writeBuffer(this.lightColorBuffer, 0, new Float32Array(this.lightMesh.colorValueArr));
		this.device.queue.writeBuffer(this.lightTypeBuffer, 0, new Float32Array(this.lightMesh.typeArr));
		this.device.queue.writeBuffer(this.lightLimitBuffer, 0, new Float32Array(this.lightMesh.limitArr));

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

		this.skyPipeline = <GPURenderPipeline>this.device.createRenderPipeline({
			layout: this.device.createPipelineLayout({
				bindGroupLayouts: [this.skyFrameBindGroupLayout],
			}),
			vertex: {
				module: this.skyShaderModule,
				entryPoint: 'v_main',
			},
			fragment: {
				module: this.skyShaderModule,
				entryPoint: 'f_main',
				targets: [
					{
						format: this.format,
					},
				],
			},
			primitive: {
				topology: 'triangle-list',
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

	writeFrameBuffers(renderables: RenderData, cameraPosition: Vec3, projection: Mat4, view: Mat4) {
		// Pass matrices into the same buffer
		// Shader will take it in as an object with 3 matrices because of the way we set it up
		this.device.queue.writeBuffer(
			this.objectBuffer,
			0,
			<ArrayBuffer>renderables.modelTransforms,
			0,
			renderables.modelTransforms.length
		);

		const lightWorldPositionsTemp: number[] = [];
		for (let i: number = 0; i < this.lightMesh.lightCount; i++) {
			lightWorldPositionsTemp.push(
				...one_four_by_four_four(
					new Float32Array(this.lightMesh.lightPositionArr.slice(i * 3, i * 3 + 3)),
					renderables.lightTransforms.slice(i * 16, i * 16 + 16)
				),
				0
			);
		}

		this.device.queue.writeBuffer(
			this.lightWorldPosBuffer,
			0,
			<ArrayBuffer>new Float32Array(lightWorldPositionsTemp),
			0,
			lightWorldPositionsTemp.length
		);

		this.device.queue.writeBuffer(this.lightDirectionBuffer, 0, renderables.rotatedLightDir);
		this.device.queue.writeBuffer(this.lightViewProjBuffer, 0, renderables.lightViewProjectionMatrices);

		if (this.lightDebug) {
			const inverseLightViewProjMatrixArr: number[] = [];
			for (let i = 0; i < lightCount; i++) {
				const inverseLightViewProjMatrix: Mat4 = mat4.inverse(
					renderables.lightViewProjectionMatrices.slice(i * 16, i * 16 + 16)
				);
				inverseLightViewProjMatrixArr.push(...inverseLightViewProjMatrix);
			}
			this.device.queue.writeBuffer(
				this.inverseLightViewProjBuffer,
				0,
				new Float32Array(inverseLightViewProjMatrixArr)
			);
		}

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

		this.device.queue.writeBuffer(
			this.cameraPosBuffer,
			0,
			<ArrayBuffer>new Float32Array([...cameraPosition, 0])
		);
		this.device.queue.writeBuffer(
			this.vpDimensionBuffer,
			0,
			<ArrayBuffer>new Float32Array([this.canvas.width, this.canvas.height])
		);

		const normalMatrixArr: number[] = [];
		for (let i: number = 0; i < objectCount; i++) {
			normalMatrixArr.push(
				...mat4.transpose(mat4.invert(renderables.modelTransforms.slice(i * 16, i * 16 + 16)))
			);
		}

		this.device.queue.writeBuffer(this.normalMatrixBuffer, 0, <ArrayBuffer>new Float32Array(normalMatrixArr));
	}

	render = async (
		renderables: RenderData,
		cameraPosition: Vec3,
		camForwards: Vec3,
		camRight: Vec3,
		camUp: Vec3
	) => {
		// If zFar (last v + alue) is too large, depth buffer gets confused
		const projection = mat4.perspectiveReverseZ(this.fov, this.aspect, 0.1, 100);
		const view = renderables.viewTransform;

		const dy = Math.tan(this.fov / 2);
		const dx = dy * this.aspect;

		this.encoder = <GPUCommandEncoder>this.device.createCommandEncoder();
		this.view = <GPUTextureView>this.context.getCurrentTexture().createView();

		this.device.queue.writeBuffer(
			this.parameterBuffer,
			0,
			new Float32Array([
				camForwards[0],
				camForwards[1],
				camForwards[2],
				0.0,
				dx * camRight[0],
				dx * camRight[1],
				dx * camRight[2],
				0.0,
				dy * camUp[0],
				dy * camUp[1],
				dy * camUp[2],
				0.0,
			]),
			0,
			12
		);

		this.writeFrameBuffers(renderables, cameraPosition, projection, view);

		// Shadow Pass -------------------------------------------

		for (let i: number = 0; i < lightCount; i++) {
			this.shadowPass = <GPURenderPassEncoder>this.encoder.beginRenderPass({
				colorAttachments: [],
				depthStencilAttachment: {
					view: this.shadow.depthTextureViewArray[i],
					depthClearValue: 0.0,
					depthLoadOp: 'clear',
					depthStoreOp: 'store',
				},
			});

			this.shadowPass.setPipeline(this.shadow.pipeline);
			this.shadowPass.setBindGroup(0, this.shadow.bindGroup);

			for (let j: number = 0; j < objectCount; j++) {
				this.shadowPass.setVertexBuffer(0, this.objectMeshes[j].positionBuffer);
				this.shadowPass.draw(this.objectMeshes[j].vertexCount, 1, 0, (i << 16) | j);
			}

			this.shadowPass.end();
		}

		// -------------------------------------------------------

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

		this.renderPass.setPipeline(this.skyPipeline);
		this.renderPass.setBindGroup(0, this.skyFrameBindGroup);
		this.renderPass.draw(6, 1, 0, 0);

		this.renderPass.setPipeline(this.pipeline);
		this.renderPass.setBindGroup(0, this.frameBindGroup);

		let objectsDrawn = 0;

		for (let i: number = 0; i < objectCount; i++) {
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
			for (let i: number = 0; i < objectCount; i++) {
				const name: string = Object.keys(objectList)[i];
				const object: IObject = objectList[name];

				if (object.hasBoundingBox) {
					this.renderPass.setVertexBuffer(0, this.objectMeshes[i].boundingBoxBuffer);
					this.renderPass.draw(this.objectMeshes[i].boundingBoxVertexCount, 1, 0, b_index);
					b_index++;
				}
			}
		}

		if (this.lightDebug) {
			this.renderPass.setPipeline(this.lightFrustums.pipeline);
			this.renderPass.setBindGroup(0, this.lightFrustums.bindGroup);
			this.renderPass.draw(8, lightCount, 0, 0);
		}

		this.renderPass.end();
		this.device.queue.submit([this.encoder.finish()]);
	};
}
