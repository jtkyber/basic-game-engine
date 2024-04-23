import { Vec3 } from 'wgpu-matrix';
import { objectList } from '../objectList';

export class LightMesh {
	device: GPUDevice;
	data: Float32Array;
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
	texture: GPUTexture;
	textureView: GPUTextureView;

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

		// The buffer offsets in the bind group need to be a multiple of 256
		// 256 divided by 4 bytes is 64
		this.lightPositionArr = this.lightPositionArr.concat(
			new Array(64 - (this.lightPositionArr.length % 64)).fill(-1)
		);
		this.brightnessArr = this.brightnessArr.concat(new Array(64 - (this.brightnessArr.length % 64)).fill(-1));
		this.colorValueArr = this.colorValueArr.concat(new Array(64 - (this.colorValueArr.length % 64)).fill(-1));

		this.data = new Float32Array(this.lightPositionArr.concat(this.brightnessArr).concat(this.colorValueArr));

		this.buffer = this.device.createBuffer({
			label: 'Light Data Buffer',
			size: this.data.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Float32Array(this.buffer.getMappedRange()).set(this.data);
		this.buffer.unmap();
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
					this.lightPositionArr.push(...position);
					this.brightnessArr.push(this.brightnessValues[this.currentLightType]);
					this.colorValueArr.push(...this.colorValues[this.currentLightType]);
					this.lightCount++;
				}
				if (!this.lightPositions[name]) this.lightPositions[name] = [];
				this.lightPositions[name].push(position);
			}
		});
	}
}