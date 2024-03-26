export interface IObjectValue {
	[id: number]: string;
}

export interface IObject {
	images: IObjectValue;
	names: IObjectValue;
	hasBoundingBox: boolean;
}

export interface IObjectData {
	[id: string]: IObject;
}

export const objectData: IObjectData = {
	floor: {
		images: {
			0: 'floor.jpg',
		},
		names: {
			0: 'floor',
		},
		hasBoundingBox: false,
	},
	house: {
		images: {
			0: 'house.png',
		},
		names: {
			0: 'house',
		},
		hasBoundingBox: true,
	},
	player: {
		images: {
			0: 'player.jpg',
		},
		names: {
			0: 'player',
		},
		hasBoundingBox: true,
	},
	spaceship: {
		images: {
			0: 'spaceship.jpg',
		},
		names: {
			0: 'spaceship',
		},
		hasBoundingBox: true,
	},
};
