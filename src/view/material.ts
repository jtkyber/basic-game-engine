export class Material {
	texture: GPUTexture;
	view: GPUTextureView;
	sampler: GPUSampler;
	depthSampler: GPUSampler;
	bindGroup: GPUBindGroup;

	async initialize(
		device: GPUDevice,
		url: string,
		bindGroupLayout: GPUBindGroupLayout,
		depthStencilView: GPUTextureView
	) {
		const res: Response = await fetch(url);
		const blob: Blob = await res.blob();
		const imageData: ImageBitmap = await createImageBitmap(blob);

		await this.loadImageBitmap(device, imageData);

		const viewDescriptor: GPUTextureViewDescriptor = {
			format: 'rgba8unorm',
			dimension: '2d',
			aspect: 'all',
			baseMipLevel: 0,
			mipLevelCount: 1,
			baseArrayLayer: 0,
			arrayLayerCount: 1,
		};
		// Will always be working with the texture view in WebGPU, not the texture itself
		this.view = this.texture.createView(viewDescriptor);

		const samplerDescriptor: GPUSamplerDescriptor = {
			addressModeU: 'repeat',
			addressModeV: 'repeat',
			magFilter: 'linear',
			minFilter: 'nearest',
			mipmapFilter: 'linear',
			maxAnisotropy: 1,
		};
		this.sampler = device.createSampler(samplerDescriptor);

		// const depthSamplerDescritor: GPUSamplerDescriptor = {
		// 	addressModeU: 'repeat',
		// 	addressModeV: 'repeat',
		// 	magFilter: 'linear',
		// 	minFilter: 'nearest',
		// 	mipmapFilter: 'linear',
		// 	maxAnisotropy: 1,
		// 	compare: 'less-equal',
		// };
		const depthSamplerDescritor: GPUSamplerDescriptor = {
			addressModeU: 'clamp-to-edge',
			addressModeV: 'clamp-to-edge',
			addressModeW: 'clamp-to-edge',
			magFilter: 'linear',
			minFilter: 'linear',
			mipmapFilter: 'nearest',
			maxAnisotropy: 1,
			compare: 'less-equal',
		};
		this.depthSampler = device.createSampler(depthSamplerDescritor);

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
				{
					binding: 2,
					resource: depthStencilView,
				},
				{
					binding: 3,
					resource: this.depthSampler,
				},
			],
		});
	}

	async loadImageBitmap(device: GPUDevice, imageData: ImageBitmap) {
		const textureDescriptor: GPUTextureDescriptor = {
			size: {
				width: imageData.width,
				height: imageData.height,
			},
			format: 'rgba8unorm',
			// Texture not always used as a render attachment
			// but webGPU sometimes requires that usage flag
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
		};

		this.texture = device.createTexture(textureDescriptor);

		device.queue.copyExternalImageToTexture(
			{ source: imageData },
			{ texture: this.texture },
			textureDescriptor.size
		);
	}
}
