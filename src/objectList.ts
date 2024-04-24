import { Car } from './model/car';
import { Floor } from './model/floor';
import { House } from './model/house';
import { Model } from './model/model';
import { Player } from './model/player';
import { Sphere } from './model/sphere';
import { Tree } from './model/tree';

export interface IObject {
	models: Model[];
	hasBoundingBox: boolean;
	hasLights: boolean;
}

export interface IObjectList {
	[id: string]: IObject;
}

export const objectList: IObjectList = {
	player: {
		models: [new Player([-5, -9.5, 0], [0, 0, 0])],
		hasBoundingBox: true,
		hasLights: false,
	},
	house: {
		models: [new House([13, -10, 0], [0, 0, 0])],
		hasBoundingBox: true,
		hasLights: true,
	},
	// tree: {
	// 	models: [new Tree([10, 2, 0], [90, 0, 0]), new Tree([10, 6, 0], [90, 0, 0])],
	// 	hasBoundingBox: true,
	// 	hasLights: false,
	// },
	floor: {
		models: [new Floor([0, 0, 0], [0, 0, 0])],
		hasBoundingBox: false,
		hasLights: false,
	},
	car: {
		models: [new Car([0, -10, 0], [0, 0, -90])],
		hasBoundingBox: false,
		hasLights: false,
	},
	// sphere: {
	// 	models: [new Sphere([2, -9.5, 0], [0, 0, 0])],
	// 	hasBoundingBox: false,
	// 	hasLights: false,
	// },
};

export const objectCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	return acc + objectList[name].models.length;
}, 0);

export const boundingBoxCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	if (objectList[name].hasBoundingBox) return acc + objectList[name].models.length;
	return acc;
}, 0);
