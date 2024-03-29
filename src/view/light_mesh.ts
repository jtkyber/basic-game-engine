import { Vec3 } from 'wgpu-matrix';
import { objectList } from '../objectList';

export class LightMesh {
	device: GPUDevice;
	vertices: Float32Array;
	buffer: GPUBuffer;
	bufferLayout: GPUVertexBufferLayout;
	currentLightType: string;
	brightnessValues: {
		[id: string]: number;
	};
	colorValues: {
		[id: string]: Vec3;
	};
	tempArr: number[];
	lightPositions: {
		[id: string]: Vec3[];
	};
	lightCount: number;
	lightPositionArr: number[];
	brightnessArr: number[];
	colorValueArr: number[];

	constructor(device: GPUDevice) {
		this.device = device;
		this.brightnessValues = {};
		this.colorValues = {};
		this.lightPositions = {};
		this.tempArr = [];
		this.lightCount = 0;
		this.lightPositionArr = [];
		this.brightnessArr = [];
		this.colorValueArr = [];
	}

	async init() {
		for (let i: number = 0; i < Object.keys(objectList).length; i++) {
			const name: string = Object.keys(objectList)[i];
			if (!objectList[name].hasLights) continue;

			const mtl_file_contents = await fetch(`dist/lights/${name}_l.mtl`).then(res => res.text());
			const obj_file_contents = await fetch(`dist/lights/${name}_l.obj`).then(res => res.text());

			const mtl_lines = mtl_file_contents.split('\n');
			const obj_lines = obj_file_contents.split('\n');

			this.read_mtl_file(mtl_lines);
			this.read_obj_file(obj_lines, name);
		}

		this.vertices = new Float32Array(
			this.lightPositionArr.concat(this.brightnessArr).concat(this.colorValueArr)
		);

		this.buffer = this.device.createBuffer({
			label: 'Light Data Buffer',
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Float32Array(this.buffer.getMappedRange()).set(this.vertices);
		this.buffer.unmap();

		// this.bufferLayout = {
		// 	arrayStride: 28,
		// 	attributes: [
		// 		// For the position
		// 		{
		// 			shaderLocation: 4,
		// 			format: 'float32x3',
		// 			offset: 0,
		// 		},
		// 		// For the Brightness
		// 		{
		// 			shaderLocation: 5,
		// 			format: 'float32',
		// 			offset: 12,
		// 		},
		// 		// For the Color
		// 		{
		// 			shaderLocation: 6,
		// 			format: 'float32x3',
		// 			offset: 16,
		// 		},
		// 	],
		// };
	}

	async read_mtl_file(lines: string[]) {
		lines.forEach(l => {
			const words = l.trim().split(' ');
			if (words[0] === 'newmtl') {
				this.currentLightType = words[1];
			} else if (words[0] === 'Ns') {
				this.brightnessValues[this.currentLightType] = Number(words[1]);
			} else if (words[0] === 'Ke') {
				this.colorValues[this.currentLightType] = [Number(words[1]), Number(words[2]), Number(words[3])];
			}
		});
	}

	async read_obj_file(lines: string[], name: string) {
		lines.forEach(l => {
			const words = l.trim().split(' ');

			if (words[0] === 'usemtl') {
				this.currentLightType = words[1];
			} else if (words[0] === 'v') {
				const components: string[] = words.filter(n => n);
				const position: Vec3 = [Number(components[1]), Number(components[2]), Number(components[3])];
				for (let i: number = 0; i < objectList[name].models.length; i++) {
					// this.tempArr.push(
					// 	...position,
					// 	this.brightnessValues[this.currentLightType],
					// 	...this.colorValues[this.currentLightType]
					// );
					this.lightPositionArr.push(...position);
					this.lightPositionArr.push(this.brightnessValues[this.currentLightType]);
					this.lightPositionArr.push(...this.colorValues[this.currentLightType]);
					this.lightCount++;
				}
				if (!this.lightPositions[name]) this.lightPositions[name] = [];
				this.lightPositions[name].push(position);
			}
		});
	}
}
