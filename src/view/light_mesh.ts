import { LightType, LightTypeString } from '../definitions';
import { ILight, objectList } from '../objectList';

export class LightMesh {
	device: GPUDevice;
	data: Float32Array;
	buffer: GPUBuffer;
	bufferLayout: GPUVertexBufferLayout;
	currentLightType: string;
	lightCount: number;
	lightPositionArr: number[];
	brightnessArr: number[];
	colorValueArr: number[];
	typeArr: number[];
	// directionArr: number[];
	limitArr: number[];

	constructor(device: GPUDevice) {
		this.device = device;
		this.lightCount = 0;
		this.lightPositionArr = [];
		this.brightnessArr = [];
		this.colorValueArr = [];
		this.typeArr = [];
		// this.directionArr = [];
		this.limitArr = [];
	}

	async init() {
		for (let i: number = 0; i < Object.keys(objectList).length; i++) {
			const name: string = Object.keys(objectList)[i];

			for (let j = 0; j < objectList[name].lights.length; j++) {
				const light: ILight = objectList[name].lights[j];

				this.lightPositionArr.push(...light.position);
				this.brightnessArr.push(light.brightness);
				this.colorValueArr.push(...light.color, 0);
				this.typeArr.push(LightType[<LightTypeString>light.type]);
				// this.directionArr.push(...(light.direction || [0, 0, 0]), 0);
				this.limitArr.push(light.limit || 0);

				this.lightCount++;
			}
		}

		this.data = new Float32Array(this.brightnessArr.concat(this.colorValueArr));

		this.buffer = this.device.createBuffer({
			label: 'Light Data Buffer',
			size: this.data.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Float32Array(this.buffer.getMappedRange()).set(this.data);
		this.buffer.unmap();
	}
}
