import { Vec3, utils } from 'wgpu-matrix';
import { Car } from './model/car';
import { Floor } from './model/floor';
import { House } from './model/house';
import { Model } from './model/model';
import { Player } from './model/player';
import { Sphere } from './model/sphere';
import { Tree } from './model/tree';

export interface ILight {
	position: Vec3;
	brightness: number;
	color: Vec3;
	type: string;
	direction?: Vec3;
	limit?: number;
}

export interface IObject {
	models: Model[];
	hasBoundingBox: boolean;
	lights: ILight[];
}

export interface IObjectList {
	[id: string]: IObject;
}

export const objectList: IObjectList = {
	player: {
		models: [new Player([-7, -9.5, 0], [0, 0, 0])],
		hasBoundingBox: true,
		lights: [],
	},
	house: {
		models: [new House([14, -10, 0], [0, 0, 0])],
		hasBoundingBox: true,
		lights: [
			{
				position: [-4.936149, 0.714075, 3.513694],
				brightness: 3.0,
				color: [1.0, 1.0, 1.0],
				type: 'spot',
				direction: [-1.0, 0.0, -0.4],
				limit: utils.degToRad(90),
			},
		],
	},
	// tree: {
	// 	models: [new Tree([10, 2, 0], [90, 0, 0])],
	// 	hasBoundingBox: true,
	// 	lights: [],
	// },
	floor: {
		models: [new Floor([0, 0, 0], [0, 0, 0])],
		hasBoundingBox: false,
		lights: [],
	},
	boundary: {
		models: [new Floor([0, 0, 0], [0, 0, 0])],
		hasBoundingBox: false,
		lights: [],
	},
	// car: {
	// 	models: [new Car([0, -10, 0], [0, 0, -90])],
	// 	hasBoundingBox: false,
	// 	lights: [],
	// },
	sphere: {
		models: [new Sphere([2, -9.5, 0], [0, 0, 0])],
		hasBoundingBox: false,
		lights: [
			// {
			// 	position: [-1, 0, 1],
			// 	brightness: 2,
			// 	color: [1.0, 0.0, 0.0],
			// 	type: 'spot',
			// 	direction: [-1.0, 0.0, 0],
			// 	limit: utils.degToRad(45),
			// },
		],
	},
};

export const objectCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	return acc + objectList[name].models.length;
}, 0);

export const boundingBoxCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	if (objectList[name].hasBoundingBox) return acc + objectList[name].models.length;
	return acc;
}, 0);

export const lightCount = Object.keys(objectList).reduce((acc: number, name: string) => {
	return acc + objectList[name].lights.length;
}, 0);
