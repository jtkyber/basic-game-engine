import { Mat4, Vec3, vec3 } from 'wgpu-matrix';
import { RenderData } from '../definitions';
import { IObject, boundingBoxCount, objectCount, objectList } from '../objectList';
import { ICollision } from '../types/types';
import { player_object_collision } from '../utils/collisions';
import { dot, num_vec_multiply, vecAdd } from '../utils/math_stuff';
import { ObjMesh } from '../view/obj_mesh';
import { Camera } from './camera';
import { Model } from './model';
import { Player } from './player';

export class Scene {
	player: Player & any;
	camera: Camera;
	modelData: Float32Array;
	boundingBoxData: Float32Array;
	moveDeltaVector: Vec3;
	camDistFromPlayer: number;
	camHeightAbovePlayer: number;
	lastPlayerPos: Vec3;
	lastCamPosition: Vec3;
	playerMoving: boolean;
	models: Model[];

	constructor() {
		this.modelData = new Float32Array(16 * objectCount);
		this.boundingBoxData = new Float32Array(16 * boundingBoxCount);
		this.camDistFromPlayer = 2.5;
		this.camHeightAbovePlayer = 0.5;
		this.playerMoving = false;
		this.player = objectList.player.models[0];
		this.camera = new Camera(
			[
				this.player.position[0] - this.camDistFromPlayer,
				this.player.position[1],
				this.player.position[2] + this.camHeightAbovePlayer,
			],
			0,
			0
		);
	}

	update(meshes: ObjMesh[], playerMesh: ObjMesh) {
		if (this.camDistFromPlayer < 1) this.camDistFromPlayer = 1;
		else if (this.camDistFromPlayer > 10) this.camDistFromPlayer = 10;

		const playerBoundingVerticesInitial: Float32Array = playerMesh.boundingBoxVerticesInitial;
		const playerBoundingVerticesGrouped: Float32Array = playerMesh.boundingBoxVerticesGrouped;

		this.player.apply_gravity();
		this.player.update();

		const playerTransform: Float32Array = new Float32Array(16);
		for (let i = 0; i < 16; i++) {
			playerTransform[i] = <number>this.player.get_model().at(i);
		}

		let i: number = 0;
		let b_index: number = 0;
		let offsetVec: Vec3 = [];
		let collisionCount: number = 0;
		let playerBoxZdeltas: number[] = [];
		let counter = 0;

		for (let n: number = 0; n < Object.keys(objectList).length; n++) {
			const name: string = Object.keys(objectList)[n];
			const object: IObject = objectList[name];

			for (let oIndex: number = 0; oIndex < object.models.length; oIndex++) {
				const model: Model = object.models[oIndex];
				model.update();
				let modelMatrix: Mat4 = model.get_model();

				for (let j: number = 0; j < 16; j++) {
					this.modelData[16 * i + j] = <number>modelMatrix.at(j);
					if (object.hasBoundingBox) this.boundingBoxData[16 * b_index + j] = <number>modelMatrix.at(j);
				}

				i++;

				if (object.hasBoundingBox && name !== 'player') {
					const modelTransorm: Float32Array = this.boundingBoxData.slice(16 * b_index, 16 * b_index + 16);
					const modelVerticesInitial: Float32Array = meshes[n].boundingBoxVerticesInitial;
					const modelVerticesGrouped: Float32Array = meshes[n].boundingBoxVerticesGrouped;

					const collisionData: ICollision[] | false = player_object_collision(
						playerBoundingVerticesInitial,
						playerBoundingVerticesGrouped,
						playerTransform,
						modelVerticesInitial,
						modelVerticesGrouped,
						modelTransorm
					);

					if (collisionData) {
						for (let k: number = 0; k < collisionData.length; k++) {
							counter++;
							if (
								this.playerMoving &&
								dot(this.moveDeltaVector, model.moveVector) >= 0 &&
								dot(this.moveDeltaVector, collisionData[k].planeNormal) <= 0
							) {
								// If moving towards the plane and object not moving toward player
								// Get vector offset along plane normal
								const offsetVecCur: Vec3 = num_vec_multiply(
									dot(this.moveDeltaVector, collisionData[k].planeNormal) / 1,
									collisionData[k].planeNormal
								);
								collisionCount++;
								offsetVec = offsetVecCur;
							} else if (this.playerMoving && dot(this.moveDeltaVector, model.moveVector) < 0) {
								// If player moving and object moving towards player
								const offsetVecCur: Vec3 = num_vec_multiply(
									dot(this.moveDeltaVector, collisionData[k].planeNormal) / 1,
									collisionData[k].planeNormal
								);
								collisionCount++;
								offsetVec = vecAdd(offsetVecCur, num_vec_multiply(-window.myLib.deltaTime, model.moveVector));
							} else if (!this.playerMoving) {
								// If player not moving and being pushed by object
								collisionCount++;
								offsetVec = num_vec_multiply(-window.myLib.deltaTime, model.moveVector);
							}
							// Include playerBoxZdelta even if vector is facing away from plane
							playerBoxZdeltas.push(collisionData[k].playerBoxZdelta);
						}
					}
					b_index++;
				}
			}
		}

		// Find max playerBoxZdelta from collisions that's within range
		let maxStepUpHeight: number = 0;
		const stepHeight: number = 0.25;
		for (let j: number = 0; j < playerBoxZdeltas.length; j++) {
			if (playerBoxZdeltas[j] > maxStepUpHeight && playerBoxZdeltas[j] < stepHeight) {
				maxStepUpHeight = playerBoxZdeltas[j];
			}
		}

		// Apply stepUp transformation
		if (collisionCount === 1) {
			const offsetVecMean: Vec3 = offsetVec;
			if (playerBoxZdeltas[0] > 0 && playerBoxZdeltas[0] < stepHeight) {
				this.player.position[2] += maxStepUpHeight;
				this.player.reset_gravity();
			} else {
				this.offset_player(offsetVecMean, -1);
			}
		} else if (collisionCount > 1) {
			if (playerBoxZdeltas[0] > 0 && playerBoxZdeltas[0] < stepHeight) {
				this.player.position[2] += maxStepUpHeight;
				this.player.reset_gravity();
			} else {
				this.player.position[0] = this.lastPlayerPos[0];
				this.player.position[1] = this.lastPlayerPos[1];

				this.camera.position[0] = this.lastCamPosition[0];
				this.camera.position[1] = this.lastCamPosition[1];
			}
		} else if (playerBoxZdeltas.length && playerBoxZdeltas[0] > 0 && playerBoxZdeltas[0] < stepHeight) {
			this.player.position[2] += maxStepUpHeight;
			this.player.reset_gravity();
		}

		this.spin_player(0, 0);
		this.player.update();
		this.camera.update();
	}

	player_moving(): boolean {
		return this.moveDeltaVector[0] !== 0 && this.moveDeltaVector[1] !== 0 && this.moveDeltaVector[2] !== 0;
	}

	get_player(): Camera {
		return this.camera;
	}

	get_renderables(): RenderData {
		return {
			viewTransform: this.camera.get_view(),
			modelTransforms: this.modelData,
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

	move_player_FB(dir: number) {
		const moveAmt: number = dir * this.player.moveSpeed * window.myLib.deltaTime;
		// Camera
		this.camera.position = vec3.addScaled(
			this.camera.position,
			// Only move the camera along the xy plane (no verticle)
			this.camera.forwardMove,
			moveAmt
		);

		// Player
		this.player.position = vec3.addScaled(this.player.position, this.camera.forwardMove, moveAmt);
	}

	move_player_LR(dir: number) {
		const moveAmt: number = dir * this.player.moveSpeed * window.myLib.deltaTime;
		// Camera
		this.camera.position = vec3.addScaled(
			this.camera.position,
			// Only move the camera along the xy plane (no verticle)
			this.camera.rightMove,
			moveAmt
		);

		// Player
		this.player.position = vec3.addScaled(this.player.position, this.camera.rightMove, moveAmt);
	}
}
