import { Floor } from './model/floor';
import { House } from './model/house';
import { Model } from './model/model';
import { Player } from './model/player';
import { Spaceship } from './model/spaceship';
import { Tree } from './model/tree';

export interface IObject {
	models: Model[];
	hasBoundingBox: boolean;
	images: { [id: number]: string };
}

export interface IObjectList {
	[id: string]: IObject;
}

export const objectList: IObjectList = {
	player: {
		models: [new Player([0, 0, 0], [0, 0, 0])],
		hasBoundingBox: true,
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
	},
	house: {
		models: [new House([13, -10, 0], [0, 0, 0])],
		hasBoundingBox: true,
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
	},
	spaceship: {
		models: [new Spaceship([13, -10, 10], [0, 0, 0])],
		hasBoundingBox: true,
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
	},
	tree: {
		models: [new Tree([10, 2, 0], [90, 0, 0]), new Tree([10, 6, 0], [90, 0, 0])],
		hasBoundingBox: true,
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
	},
	floor: {
		models: [new Floor([0, 0, 0], [0, 0, 0])],
		hasBoundingBox: false,
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
	},
};

export const objectCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	return acc + objectList[name].models.length;
}, 0);

export const boundingBoxCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	if (objectList[name].hasBoundingBox) return acc + objectList[name].models.length;
	return acc;
}, 0);
