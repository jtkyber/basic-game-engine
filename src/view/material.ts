export class Material {
	texture: GPUTexture;
	view: GPUTextureView;
	skyView: GPUTextureView;
	sampler: GPUSampler;
	bindGroup: GPUBindGroup;

	async initialize(
		device: GPUDevice,
		images: { [id: number]: string },
		bindGroupLayout: GPUBindGroupLayout,
	) {
		const viewDescriptor: GPUTextureViewDescriptor = {
			format: 'rgba8unorm',
			dimension: '2d-array',
			aspect: 'all',
			baseMipLevel: 0,
			mipLevelCount: 1,
			baseArrayLayer: 0,
			arrayLayerCount: Object.keys(images).length,
		};

		const samplerDescriptor: GPUSamplerDescriptor = {
			addressModeU: 'repeat',
			addressModeV: 'repeat',
			magFilter: 'linear',
			minFilter: 'nearest',
			mipmapFilter: 'linear',
			maxAnisotropy: 1,
		};

		if (Object.keys(images).length) {
			await this.loadImageBitmap(device, images);

			this.view = this.texture.createView(viewDescriptor);
		} else {
			this.texture = device.createTexture({
				label: 'Combined Texture Descriptor',
				size: {
					width: 1,
					height: 1,
					depthOrArrayLayers: 1,
				},
				format: 'rgba8unorm',
				usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
			});
			this.view = this.texture.createView({
				format: 'rgba8unorm',
				dimension: '2d-array',
				aspect: 'all',
				baseMipLevel: 0,
				mipLevelCount: 1,
				baseArrayLayer: 0,
				arrayLayerCount: 1,
			});
		}

		this.sampler = device.createSampler(samplerDescriptor);

		this.bindGroup = device.createBindGroup({
			layout: bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: this.view,
				},
				{
					binding: 1,
					resource: this.sampler,
				},
			],
		});
	}

	async getMaxSize(urls: string[]): Promise<{ width: number; height: number }> {
		let width: number = 0;
		let height: number = 0;

		for (let i: number = 0; i < urls.length; i++) {
			const url: string = urls[i];
			const res: Response = await fetch(url);
			const blob: Blob = await res.blob();
			const imageData: ImageBitmap = await createImageBitmap(blob);

			if (imageData.width > width) width = imageData.width;
			if (imageData.height > height) height = imageData.height;
		}

		return { width, height };
	}

	async fetchAndDecodeImage(url: string): Promise<ImageData> {
		const res: Response = await fetch(url);
		const blob: Blob = await res.blob();
		const bitmap: ImageBitmap = await createImageBitmap(blob);
		const canvas: OffscreenCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const context = <OffscreenCanvasRenderingContext2D>canvas.getContext('2d');
		context.drawImage(bitmap, 0, 0);
		return context.getImageData(0, 0, canvas.width, canvas.height);
	}

	async loadImageBitmap(device: GPUDevice, images: { [id: number]: string }) {
		const urls: string[] = Object.values(images);
		const layers: number = urls.length;

		const { width, height } = await this.getMaxSize(urls);
		const combinedTextureData: Uint8Array = new Uint8Array(width * height * 4 * layers);

		for (let i: number = 0; i < layers; i++) {
			const url: string = urls[i];
			const imageData = await this.fetchAndDecodeImage(url);
			const imageDataArray: Uint8Array = new Uint8Array(imageData.data.buffer);
			const offset = i * width * height * 4;
			combinedTextureData.set(imageDataArray, offset);
		}

		if (!combinedTextureData?.byteLength) return;

		const textureDescriptor: GPUTextureDescriptor = {
			label: 'Combined Texture Descriptor',
			size: {
				width: width,
				height: height,
				depthOrArrayLayers: urls.length,
			},
			format: 'rgba8unorm',
			// Texture not always used as a render attachment
			// but webGPU sometimes requires that usage flag
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
		};

		this.texture = device.createTexture(textureDescriptor);

		device.queue.writeTexture(
			{ texture: this.texture },
			combinedTextureData,
			{ bytesPerRow: width * 4, rowsPerImage: height },
			textureDescriptor.size
		);
	}
}
