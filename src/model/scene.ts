import { Mat4, Vec3, Vec4, vec3 } from 'wgpu-matrix';
import { RenderData } from '../definitions';
import { player_object_collision } from '../utils/collisions';
import { dot, normalize, num_vec_multiply } from '../utils/math_stuff';
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
	camera: Camera;
	objectData: Float32Array;
	boundingBoxData: Float32Array;
	moveDeltaVector: Vec3;
	camDistFromPlayer: number;
	camHeightAbovePlayer: number;

	constructor(objectImages: string[], boundingBoxNames: string[]) {
		this.objectImages = objectImages;
		this.boundingBoxNames = boundingBoxNames;
		this.objectData = new Float32Array(16 * 4);
		this.boundingBoxData = new Float32Array(16 * 3);
		this.camDistFromPlayer = 2.5;
		this.camHeightAbovePlayer = 0.5;

		this.player = new Player([0, 0, 0], [0, 0, 0]);
		this.spaceship = new Spaceship([0, -20, 0], [0, 0, 0]);
		this.house = new House([13, -10, 0], [0, 0, 0]);
		this.floor = new Floor([0, 0, 0], [0, 0, 0]);

		this.camera = new Camera(
			[this.player.position[0] - this.camDistFromPlayer, this.player.position[1], this.player.position[2]],
			this.camHeightAbovePlayer,
			-10
		);
	}

	update(meshes: ObjMesh[], playerMesh: ObjMesh) {
		if (this.camDistFromPlayer < 1) this.camDistFromPlayer = 1;
		else if (this.camDistFromPlayer > 10) this.camDistFromPlayer = 10;

		const playerBoundingVerticesInitial: Float32Array = playerMesh.boundingBoxVerticesInitial;
		const playerBoundingVerticesGrouped: Float32Array = playerMesh.boundingBoxVerticesGrouped;

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
				const modelVerticesInitial: Float32Array = meshes[n].boundingBoxVerticesInitial;
				const modelVerticesgrouped: Float32Array = meshes[n].boundingBoxVerticesGrouped;

				const contactPlaneNormal: Vec3 | false = player_object_collision(
					playerBoundingVerticesInitial,
					playerBoundingVerticesGrouped,
					playerTransform,
					modelVerticesInitial,
					modelVerticesgrouped,
					modelTransorm
				);

				if (contactPlaneNormal) {
					// Maybe check if player is colliding with more than one
					// cuboid, and if so, average the offset vectors.

					// Then, check intersection along z (vertical) axis for top planes of each intersected
					// cuboid and check if bottom z of player is close enough,
					// then match player height to highest possible cuboid
					if (dot(this.moveDeltaVector, contactPlaneNormal) <= 0) {
						const offsetVec: Vec3 = num_vec_multiply(
							dot(this.moveDeltaVector, contactPlaneNormal) / 1,
							contactPlaneNormal
						);
						this.offset_player(offsetVec, -1);
					}
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
		this.camera.position = [
			this.player.position[0],
			this.player.position[1],
			this.player.position[2] + this.camHeightAbovePlayer,
		];

		// Apply rotations
		this.camera.eulers[2] += dX;
		this.camera.eulers[2] %= 360;

		this.camera.eulers[1] = Math.min(89, Math.max(-89, this.camera.eulers[1] + dY));

		// Translate straight back along the forwards vector to the camera
		this.camera.position = vec3.addScaled(
			this.camera.position,
			this.camera.forwards,
			-this.camDistFromPlayer
		);
	}

	offset_player(dir: Vec3, amt: number) {
		// Camera
		this.camera.position = vec3.addScaled(this.camera.position, [dir[0], dir[1], 0], amt);

		// Player
		this.player.position = vec3.addScaled(this.player.position, [dir[0], dir[1], 0], amt);
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
