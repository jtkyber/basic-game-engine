export interface IObjectValue {
	[id: number]: string;
}

export interface IObject {
	images: IObjectValue;
	hasBoundingBox: boolean;
}

export interface IObjectData {
	[id: string]: IObject;
}

export const objectData: IObjectData = {
	tree: {
		images: {
			0: 'GenTree_1_Trunk_Limbs_AE3D_03312023-A-DIFFUSE_DISP.png',
			1: 'GenTree_1_Trunk_Limbs_AE3D_03312023-A-DIFFUSE_SPEC.png',
			2: 'GenTree_1_Trunk_Limbs_AE3D_03312023-A-DIFFUSE.png',
			3: 'GenTree_1_Trunk_Limbs_AE3D_03312023-A-HEIGHT.png',
			4: 'GenTree_1_Trunk_Limbs_AE3D_03312023-A-NORMAL.png',
			5: 'GenTree_1_Trunk_Limbs_AE3D_03312023-A-SMOOTH.png',
			6: 'GenTree_1_Twigs_AE3D_03312023-A-DIFFUSE.png',
			7: 'Maple_AE3D_03272021-A2-50pc.png',
		},
		hasBoundingBox: true,
	},
	floor: {
		images: {
			0: 'floor.jpg',
		},
		hasBoundingBox: false,
	},
	house: {
		images: {
			0: 'house.png',
		},
		hasBoundingBox: true,
	},
	player: {
		images: {
			0: 'player.jpg',
		},
		hasBoundingBox: true,
	},
	spaceship: {
		images: {
			0: 'spaceship.jpg',
		},
		hasBoundingBox: true,
	},
};
