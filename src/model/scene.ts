import { Mat4, Vec3, vec3 } from 'wgpu-matrix';
import { RenderData } from '../definitions';
import { player_object_collision } from '../utils/collisions';
import { ObjMesh } from '../view/obj_mesh';
import { Camera } from './camera';
import { Floor } from './floor';
import { House } from './house';
import { Player } from './player';
import { Spaceship } from './spaceship';

export class Scene {
	objectImages: string[];
	boundingBoxNames: string[];
	spaceship: Spaceship;
	house: House;
	player: Player;
	floor: Floor;
	spinSpeeds: number[];
	camera: Camera;
	objectData: Float32Array;
	boundingBoxData: Float32Array;

	constructor(objectImages: string[], boundingBoxNames: string[]) {
		this.objectImages = objectImages;
		this.boundingBoxNames = boundingBoxNames;
		this.spinSpeeds = [];
		this.objectData = new Float32Array(16 * 4);
		this.boundingBoxData = new Float32Array(16 * 3);

		this.player = new Player([0, 0, 0], [0, 0, 0]);
		this.spaceship = new Spaceship([0, -60, 3], [0, 0, 0]);
		this.house = new House([13, -10, 0], [0, 0, 0]);
		this.floor = new Floor([0, 0, 0], [0, 0, 0]);

		// this.camera = new Camera([-2, 0, 1], 0, 0);
		this.camera = new Camera(
			[this.player.position[0] - 4, this.player.position[1], this.player.position[2] + 1.5],
			0,
			-10
		);
	}

	update(meshes: ObjMesh[], playerMesh: ObjMesh) {
		const playerBoundingVertices: Float32Array = playerMesh.boundingBoxVerticesInitial;

		this.player.update();
		const playerTransform: Float32Array = new Float32Array(16);
		for (let i = 0; i < 16; i++) {
			playerTransform[i] = <number>this.player.get_model().at(i);
		}

		let i: number = 0;
		let b_index: number = 0;
		for (let n: number = 0; n < this.objectImages.length; n++) {
			const name: string = this.objectImages[n].split('.')[0];

			(this as any)[name].update();
			let model2 = (this as any)[name].get_model();

			const hasBoundingBoxes = this.boundingBoxNames.includes(name);

			for (let j: number = 0; j < 16; j++) {
				// Fill objectData with the model matrices for all the quads
				this.objectData[16 * i + j] = <number>model2.at(j);
				if (hasBoundingBoxes) {
					this.boundingBoxData[16 * b_index + j] = <number>model2.at(j);
				}
			}

			i++;

			if (hasBoundingBoxes && meshes[n].modelName !== 'player') {
				const modelTransorm: Float32Array = this.objectData.slice(16 * b_index, 16 * b_index + 16);
				const modelVertices: Float32Array = meshes[n].boundingBoxVerticesInitial;

				if (player_object_collision(playerBoundingVertices, playerTransform, modelVertices, modelTransorm)) {
					console.log('Collision');
				}
				b_index++;
			}
		}

		this.camera.update();
	}

	get_player(): Camera {
		return this.camera;
	}

	get_renderables(): RenderData {
		return {
			viewTransform: this.camera.get_view(),
			modelTransforms: this.objectData,
			boundingBoxTransforms: this.boundingBoxData,
		};
	}

	spin_player(dX: number, dY: number) {
		// Camera
		// Translate to center eye level of player
		this.camera.position = [this.player.position[0], this.player.position[1], this.player.position[2] + 1.5];

		// Apply rotations
		this.camera.eulers[2] += dX;
		this.camera.eulers[2] %= 360;

		this.camera.eulers[1] = Math.min(89, Math.max(-89, this.camera.eulers[1] + dY));

		// Translate straight back along the forwards vector to the camera
		this.camera.position = vec3.addScaled(this.camera.position, this.camera.forwards, -4);

		// Player
		this.player.eulers[1] = this.camera.eulers[2];
	}

	move_player_FB(forwardsAmt: number) {
		// Camera
		this.camera.position = vec3.addScaled(
			this.camera.position,
			// Only move the camera along the xy plane (no verticle)
			this.camera.forwardMove,
			forwardsAmt
		);

		// Player
		this.player.position = vec3.addScaled(this.player.position, this.camera.forwardMove, forwardsAmt);
	}

	move_player_LR(rightAmt: number) {
		// Camera
		this.camera.position = vec3.addScaled(
			this.camera.position,
			// Only move the camera along the xy plane (no verticle)
			this.camera.rightMove,
			rightAmt
		);

		// Player
		this.player.position = vec3.addScaled(this.player.position, this.camera.rightMove, rightAmt);
	}
}
