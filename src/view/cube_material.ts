export class CubeMaterial {
	texture: GPUTexture;
	view: GPUTextureView;
	sampler: GPUSampler;
	bindGroup: GPUBindGroup;

	async initialize(device: GPUDevice, images: { [id: number]: string }) {
		let imageData: ImageBitmap[] = new Array(6);

		for (let i: number = 0; i < 6; i++) {
			const response: Response = await fetch(images[i]);
			const blob: Blob = await response.blob();
			imageData[i] = await createImageBitmap(blob);
		}

		await this.loadImageBitmaps(device, imageData);

		this.view = this.texture.createView({
			format: 'rgba8unorm',
			dimension: 'cube',
			aspect: 'all',
			baseMipLevel: 0,
			mipLevelCount: 1,
			baseArrayLayer: 0,
			arrayLayerCount: 6,
		});

		this.sampler = device.createSampler({
			addressModeU: 'repeat',
			addressModeV: 'repeat',
			magFilter: 'linear',
			minFilter: 'nearest',
			mipmapFilter: 'nearest',
			maxAnisotropy: 1,
		});
	}

	async loadImageBitmaps(device: GPUDevice, imageData: ImageBitmap[]) {
		const textureDescriptor: GPUTextureDescriptor = {
			dimension: '2d',
			size: {
				width: imageData[0].width,
				height: imageData[0].height,
				depthOrArrayLayers: 6,
			},
			format: 'rgba8unorm',
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
		};

		this.texture = device.createTexture(textureDescriptor);

		for (let i = 0; i < 6; i++) {
			device.queue.copyExternalImageToTexture(
				{ source: imageData[i] },
				{ texture: this.texture, origin: [0, 0, i] },
				[imageData[i].width, imageData[i].height]
			);
		}
	}
}
