import { Vec2, Vec3 } from 'wgpu-matrix';

export class ObjMesh {
	device: GPUDevice;
	buffer: GPUBuffer;
	boundingBoxBuffer: GPUBuffer;
	bufferLayout: GPUVertexBufferLayout;
	boundingBoxBufferLayout: GPUVertexBufferLayout;
	// Position Coordinates
	v: Vec3[];
	// UV Coordinates
	vt: Vec2[];
	// Vector Normals
	vn: Vec3[];
	// BoundingBox vertices
	vb: number[][];
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
	materialIndeces: {
		[id: string]: number;
	};

	constructor(device: GPUDevice) {
		this.device = device;
		this.v = [];
		this.vt = [];
		this.vn = [];
		this.vb = [];
		this.materialFilenames = {};
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

	async initialize(url: string) {
		// prettier-ignore
		await this.read_mtl_file(url)
		await this.read_obj_file(url);
		this.vertexCount = this.vertices.length / 9;

		this.buffer = this.device.createBuffer({
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Float32Array(this.buffer.getMappedRange()).set(this.vertices);
		this.buffer.unmap();

		this.bufferLayout = {
			arrayStride: 36,
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
					// this.materialFilenames[this.currentMaterial] = words[1];
					this.materialIndeces[this.currentMaterial] = filenameValues.indexOf(words[1]);
				} else {
					this.materialFilenames[this.currentMaterial] = words[1];
					this.materialIndeces[this.currentMaterial] = materialCount;
					materialCount++;
				}
			}
		});
	}

	async read_obj_file(url: string) {
		let result: number[] = [];
		// Fetch object and split into array of strings
		// where each new line is an element in the array
		const file_contents = await fetch(`${url}.obj`).then(res => res.text());
		const lines = file_contents.split('\n');

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
			}
		});

		this.vertices = new Float32Array(result);
	}

	read_vertex_line(line: string) {
		// What we have: ['v', x, y, z]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [x, y, z]
		const newVertex: Vec3 = [Number(components[1]), Number(components[2]), Number(components[3])];
		this.v.push(newVertex);
	}

	read_vertex_line_b(line: string) {
		// What we have: ['v', x, y, z]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [x, y, z]
		const newVertex: Vec3 = [Number(components[1]), Number(components[2]), Number(components[3])];
		this.vb.push(newVertex);
	}

	read_texcoord_line(line: string) {
		// What we have: ['vt', u, v]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [u, v]
		const newTextcoord: Vec2 = [Number(components[1]), Number(components[2])];
		this.vt.push(newTextcoord);
	}

	read_normal_line(line: string) {
		// What we have: ['vn', nx, ny, nz]
		const components: string[] = line.split(' ').filter(n => n);
		// What we want: [nx, ny, nz]
		const newNormal: Vec3 = [Number(components[1]), Number(components[2]), Number(components[3])];
		this.vn.push(newNormal);
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
		const v = this.v[Number(v_vt_vn[0]) - 1];
		const vt = this.vt[Number(v_vt_vn[1]) - 1];
		const vn = this.vn[Number(v_vt_vn[2]) - 1];

		res.push(v[0]);
		res.push(v[1]);
		res.push(v[2]);

		if (vt) {
			res.push(vt[0]);
			res.push(vt[1]);
			// res.push(0);
			res.push(this.materialIndeces[this.currentMaterial]);
		}

		if (vn) {
			res.push(vn[0]);
			res.push(vn[1]);
			res.push(vn[2]);
		}
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
