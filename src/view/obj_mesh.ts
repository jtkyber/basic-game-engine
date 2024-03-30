import { Vec2, Vec3 } from 'wgpu-matrix';

export class ObjMesh {
	device: GPUDevice;
	buffer: GPUBuffer;
	boundingBoxBuffer: GPUBuffer;
	bufferLayout: GPUVertexBufferLayout;
	boundingBoxBufferLayout: GPUVertexBufferLayout;
	// Position Coordinates
	v: Float32Array;
	// UV Coordinates
	vt: Float32Array;
	// Vector Normals
	vn: Float32Array;
	// BoundingBox vertices
	vb: number[][];
	vCount: number;
	vtCount: number;
	vnCount: number;
	vertices: Float32Array;
	boundingBoxVertices: Float32Array;
	boundingBoxVerticesInitial: Float32Array;
	boundingBoxVerticesGrouped: Float32Array;
	vertexCount: number;
	boundingBoxVertexCount: number;
	modelName: string;
	currentMaterial: string;
	materialFilenames: {
		[id: string]: string;
	};
	materialShininess: {
		[id: string]: number;
	};
	materialSpecualar: {
		[id: string]: Vec3;
	};
	materialAmbient: {
		[id: string]: Vec3;
	};
	materialDiffuse: {
		[id: string]: Vec3;
	};
	materialIndeces: {
		[id: string]: number;
	};

	constructor(device: GPUDevice) {
		this.device = device;
		this.vertices = new Float32Array([]);
		this.vb = [];
		this.vCount = 0;
		this.vtCount = 0;
		this.vnCount = 0;
		this.materialFilenames = {};
		this.materialSpecualar = {};
		this.materialAmbient = {};
		this.materialDiffuse = {};
		this.materialShininess = {};
		this.materialIndeces = {};
	}

	set_model_name(name: string) {
		this.modelName = name;
	}

	group_by_face(vertices: number[][], lines: string[]): Float32Array {
		const newArr: number[] = [];

		lines.forEach(l => {
			const line = l.trim();
			if (line[0] === 'f') {
				const faceIndeces: string[] = line.split(' ').map(l => l.split('/')[0]);

				newArr.push(...vertices[Number(faceIndeces[1]) - 1]);
				newArr.push(...vertices[Number(faceIndeces[2]) - 1]);
				newArr.push(...vertices[Number(faceIndeces[3]) - 1]);
				newArr.push(...vertices[Number(faceIndeces[4]) - 1]);
			}
		});

		return new Float32Array(newArr);
	}

	async generate_bounding_boxes(url: string) {
		const file_contents = await fetch(url).then(res => res.text());
		const lines = file_contents.split('\n');

		let result: number[] = [];

		lines.forEach(l => {
			const line = l.trim();
			if (line[0] === 'v' && line[1] === ' ') {
				this.read_vertex_line_b(line);
			} else if (line[0] === 'f') {
				this.read_face_line_b(line, result);
			}
		});

		this.boundingBoxVertices = new Float32Array(result);
		this.boundingBoxVertexCount = this.boundingBoxVertices.length / 3;

		this.boundingBoxVerticesInitial = new Float32Array(this.vb.flat());
		this.boundingBoxVerticesGrouped = this.group_by_face(this.vb, lines);

		this.boundingBoxBuffer = this.device.createBuffer({
			size: this.boundingBoxVertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Float32Array(this.boundingBoxBuffer.getMappedRange()).set(this.boundingBoxVertices);
		this.boundingBoxBuffer.unmap();
	}

	set_sizes(lines: string[]): void {
		let vNum: number = 0;
		let vtNum: number = 0;
		let vnNum: number = 0;

		for (let i: number = 0; i < lines.length; i++) {
			if (lines[i][0] === 'v' && lines[i][1] === ' ') vNum += 3;
			else if (lines[i][0] === 'v' && lines[i][1] === 't') vtNum += 2;
			else if (lines[i][0] === 'v' && lines[i][1] === 'n') vnNum += 3;
		}

		this.v = new Float32Array(vNum);
		this.vt = new Float32Array(vtNum);
		this.vn = new Float32Array(vnNum);
	}

	async initialize(url: string) {
		// prettier-ignore
		await this.read_mtl_file(url)
		await this.read_obj_file(url);
		this.vertexCount = this.vertices.length / 19;

		this.buffer = this.device.createBuffer({
			label: 'Obj Mesh Buffer',
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Float32Array(this.buffer.getMappedRange()).set(this.vertices);
		this.buffer.unmap();

		this.bufferLayout = {
			arrayStride: 76,
			attributes: [
				// For the position
				{
					shaderLocation: 0,
					format: 'float32x3',
					offset: 0,
				},
				// For the UVs
				{
					shaderLocation: 1,
					format: 'float32x2',
					offset: 12,
				},
				// For the material indeces
				{
					shaderLocation: 2,
					format: 'float32',
					offset: 20,
				},
				// For the face normals
				{
					shaderLocation: 3,
					format: 'float32x3',
					offset: 24,
				},
				// For Shininess (Ns)
				{
					shaderLocation: 4,
					format: 'float32',
					offset: 36,
				},
				// For Specular (Ks)
				{
					shaderLocation: 5,
					format: 'float32x3',
					offset: 40,
				},
				// For Ambient (Ka)
				{
					shaderLocation: 6,
					format: 'float32x3',
					offset: 52,
				},
				// For Diffuse (Kd)
				{
					shaderLocation: 7,
					format: 'float32x3',
					offset: 64,
				},
			],
		};
	}

	async read_mtl_file(url: string) {
		const file_contents = await fetch(`${url}.mtl`).then(res => res.text());
		const lines = file_contents.split('\n');
		let materialCount: number = 0;

		lines.forEach(l => {
			const words = l.trim().split(' ');
			if (words[0] === 'newmtl') {
				this.currentMaterial = words[1];
			} else if (words[0] === 'map_Kd') {
				const filenameValues: string[] = Object.values(this.materialFilenames);
				if (filenameValues.includes(words[1])) {
					this.materialIndeces[this.currentMaterial] = filenameValues.indexOf(words[1]);
				} else {
					this.materialFilenames[this.currentMaterial] = words[1];
					this.materialIndeces[this.currentMaterial] = materialCount;
					materialCount++;
				}
			} else if (words[0] === 'Ka') {
				this.materialAmbient[this.currentMaterial] = [Number(words[1]), Number(words[2]), Number(words[3])];
			} else if (words[0] === 'Ks') {
				this.materialSpecualar[this.currentMaterial] = [Number(words[1]), Number(words[2]), Number(words[3])];
			} else if (words[0] === 'Ns') {
				this.materialShininess[this.currentMaterial] = Number(words[1]);
			} else if (words[0] === 'Kd') {
				this.materialDiffuse[this.currentMaterial] = [Number(words[1]), Number(words[2]), Number(words[3])];
			}
		});
	}

	async read_obj_file(url: string) {
		let result: number[] = [];
		// Fetch object and split into array of strings
		// where each new line is an element in the array
		const file_contents = await fetch(`${url}.obj`).then(res => res.text());
		const lines = file_contents.split('\n');

		this.set_sizes(lines);

		lines.forEach(l => {
			const line = l.trim();
			if (line[0] === 'v' && line[1] === ' ') {
				this.read_vertex_line(line);
			} else if (line[0] === 'v' && line[1] === 't') {
				this.read_texcoord_line(line);
			} else if (line[0] === 'v' && line[1] === 'n') {
				this.read_normal_line(line);
			} else if (line.split(' ')[0] === 'usemtl') {
				this.currentMaterial = line.split(' ')[1];
			} else if (line[0] === 'f') {
				this.read_face_line(line, result);

				if (result.length >= 10000000) {
					const arrTemp: Float32Array = new Float32Array(this.vertices.length + result.length);
					arrTemp.set(this.vertices);
					arrTemp.set(result, this.vertices.length);
					this.vertices = arrTemp;
					result = [];
				}
			}
		});

		const arrTemp: Float32Array = new Float32Array(this.vertices.length + result.length);
		arrTemp.set(this.vertices);
		arrTemp.set(result, this.vertices.length);
		this.vertices = arrTemp;
		result = [];
	}

	read_vertex_line(line: string) {
		// What we have: ['v', x, y, z]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [x, y, z]
		const newVertex: Vec3 = [Number(components[1]), Number(components[2]), Number(components[3])];
		// this.v.push(newVertex);
		this.v[this.vCount] = newVertex[0];
		this.v[this.vCount + 1] = newVertex[1];
		this.v[this.vCount + 2] = newVertex[2];
		this.vCount += 3;
	}

	read_texcoord_line(line: string) {
		// What we have: ['vt', u, v]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [u, v]
		const newTextcoord: Vec2 = [Number(components[1]), Number(components[2])];
		// this.vt.push(newTextcoord);
		this.vt[this.vtCount] = newTextcoord[0];
		this.vt[this.vtCount + 1] = newTextcoord[1];
		this.vtCount += 2;
	}

	read_normal_line(line: string) {
		// What we have: ['vn', nx, ny, nz]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [nx, ny, nz]
		const newNormal: Vec3 = [Number(components[1]), Number(components[2]), Number(components[3])];
		// this.vn.push(newNormal);
		this.vn[this.vnCount] = newNormal[0];
		this.vn[this.vnCount + 1] = newNormal[1];
		this.vn[this.vnCount + 2] = newNormal[2];
		this.vnCount += 3;
	}

	read_face_line(line: string, result: number[]) {
		// Face line elements describe how the vertices are layed out
		// to make the triangles for the polygon

		line = line.replace('\n', '');
		const vertexDescriptions: string[] = line.split(' ').filter(n => n);
		// What we have: ['f', v1, v2, ...]
		// Number of triangles = # of vertices - 2 (-3 here because of the 'f' element)
		const triangleCount = vertexDescriptions.length - 3;

		for (let i = 0; i < triangleCount; i++) {
			this.read_corner(vertexDescriptions[1], result);
			this.read_corner(vertexDescriptions[2 + i], result);
			this.read_corner(vertexDescriptions[3 + i], result);
		}
	}

	read_corner(vertexDescription: string, res: number[]) {
		const v_vt_vn = vertexDescription.split('/');

		const vStart = (Number(v_vt_vn[0]) - 1) * 3;
		const v = [this.v[vStart], this.v[vStart + 1], this.v[vStart + 2]];

		const vtStart = (Number(v_vt_vn[1]) - 1) * 2;
		const vt = [this.vt[vtStart], this.vt[vtStart + 1]];

		const vnStart = (Number(v_vt_vn[2]) - 1) * 3;
		const vn = [this.vn[vnStart], this.vn[vnStart + 1], this.vn[vnStart + 2]];

		res.push(v[0]);
		res.push(v[1]);
		res.push(v[2]);

		res.push(vt[0]);
		res.push(vt[1]);

		res.push(Number(this.materialIndeces[this.currentMaterial]) || 0);

		res.push(vn[0]);
		res.push(vn[1]);
		res.push(vn[2]);

		res.push(this.materialShininess[this.currentMaterial]);
		res.push(...this.materialSpecualar[this.currentMaterial]);
		res.push(...this.materialAmbient[this.currentMaterial]);
		res.push(...this.materialDiffuse[this.currentMaterial]);
	}

	read_vertex_line_b(line: string) {
		// What we have: ['v', x, y, z]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [x, y, z]
		const newVertex: Vec3 = [Number(components[1]), Number(components[2]), Number(components[3])];
		this.vb.push(newVertex);
	}

	read_face_line_b(line: string, result: number[]) {
		// Face line elements describe how the vertices are layed out
		// to make the triangles for the polygon

		line = line.replace('\n', '');
		const vertexDescriptions: string[] = line.split(' ').filter(n => n);
		// What we have: ['f', v1, v2, ...]
		// Number of triangles = # of vertices - 2 (-3 here because of the 'f' element)
		const triangleCount = vertexDescriptions.length - 3;
		// console.log(triangleCount);

		for (let i = 0; i < triangleCount; i++) {
			this.read_corner_b(vertexDescriptions[1], result);
			this.read_corner_b(vertexDescriptions[2 + i], result);
			this.read_corner_b(vertexDescriptions[3 + i], result);
		}
	}

	read_corner_b(vertexDescription: string, res: number[]) {
		const v_vt_vn = vertexDescription.split('/');
		const v = this.vb[Number(v_vt_vn[0]) - 1];
		// Can add in vn if wanted later
		res.push(v[0]);
		res.push(v[1]);
		res.push(v[2]);
	}
}
