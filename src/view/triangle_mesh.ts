export class TriangleMesh {
	buffer: GPUBuffer;
	bufferLayout: GPUVertexBufferLayout;
	vertices: Float32Array;

	constructor(device: GPUDevice) {
		// prettier-ignore
		this.vertices = new Float32Array( [
            // x y z u v
            0.0, 0.0, 0.5, 0.5, 0.0,
            0.0, -0.5, -0.5, 0.2, 1.0,
            0.0, 0.5, -0.5, 0.8, 1.0,
        ])
		this.buffer = device.createBuffer({
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});

		new Float32Array(this.buffer.getMappedRange()).set(this.vertices);
		this.buffer.unmap();

		this.bufferLayout = {
			arrayStride: 20,
			attributes: [
				// For the position
				{
					shaderLocation: 0,
					format: 'float32x3',
					offset: 0,
				},
				// For the color
				{
					shaderLocation: 1,
					format: 'float32x2',
					offset: 12,
				},
			],
		};
	}
}
