import { Vec3 } from 'wgpu-matrix';
import { Floor } from './model/floor';
import { House } from './model/house';
import { Model } from './model/model';
import { Player } from './model/player';
import { Spaceship } from './model/spaceship';
import { Tree } from './model/tree';

export interface IObject {
	models: Model[];
	lightSources: Vec3[];
	hasBoundingBox: boolean;
}

export interface IObjectList {
	[id: string]: IObject;
}

export const objectList: IObjectList = {
	player: {
		models: [new Player([0, 0, 10], [0, 0, 0])],
		lightSources: [],
		hasBoundingBox: true,
	},
	house: {
		models: [new House([13, -10, 0], [0, 0, 0])],
		lightSources: [],
		hasBoundingBox: true,
	},
	spaceship: {
		models: [new Spaceship([13, -10, 10], [0, 0, 0])],
		lightSources: [],
		hasBoundingBox: true,
	},
	tree: {
		models: [new Tree([10, 2, 0], [90, 0, 0]), new Tree([10, 6, 0], [90, 0, 0])],
		lightSources: [],
		hasBoundingBox: true,
	},
	floor: {
		models: [new Floor([0, 0, 0], [0, 0, 0])],
		lightSources: [],
		hasBoundingBox: false,
	},
};

export const objectCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	return acc + objectList[name].models.length;
}, 0);

export const boundingBoxCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	if (objectList[name].hasBoundingBox) return acc + objectList[name].models.length;
	return acc;
}, 0);
