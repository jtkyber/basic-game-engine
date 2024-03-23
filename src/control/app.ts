import { Vec2, Vec3 } from 'wgpu-matrix';
import { Scene } from '../model/scene';
import { vecA_minus_vecB } from '../utils/math_stuff';
import { ObjMesh } from '../view/obj_mesh';
import { Renderer } from '../view/renderer';

export class App {
	canvas: HTMLCanvasElement;
	renderer: Renderer;
	objectImages: string[];
	boundingBoxNames: string[];
	collisionDebug: boolean;
	scene: Scene;
	keysPressed: string[];
	moveVec: Vec2;
	timeStamp: number;
	fpsValue: string;
	pointerLocked: boolean;
	maxFramerate: number;
	loopWaitTime: number;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.objectImages = ['house.png', 'spaceship.jpg', 'player.jpg', 'floor.jpg'];
		this.boundingBoxNames = ['house', 'spaceship', 'player'];
		this.collisionDebug = false;
		this.renderer = new Renderer(canvas, this.objectImages, this.boundingBoxNames, this.collisionDebug);
		this.scene = new Scene(this.objectImages, this.boundingBoxNames);
		this.pointerLocked = false;
		this.maxFramerate = 60;
		this.loopWaitTime = (1 / this.maxFramerate) * 1000;

		document.addEventListener('keydown', e => this.handleKeyDown(e));
		document.addEventListener('keyup', e => this.handleKeyUp(e));
		document.addEventListener('mousemove', e => this.handleMouseMove(e));
		document.addEventListener('mousedown', e => this.handleMouseDown(e));
		this.canvas.addEventListener('wheel', e => this.handleScrollWheel(e), { passive: true });
		document.addEventListener(
			'pointerlockchange',
			() => {
				if (document.pointerLockElement === canvas) {
					this.pointerLocked = true;
				} else this.pointerLocked = false;
			},
			false
		);
		this.keysPressed = [];
		this.moveVec = [0, 0];
	}

	async initialize() {
		window.myLib = window.myLib || {};
		window.myLib.deltaTime = 0;
		await this.renderer.initialize();
	}

	run = async () => {
		let running: boolean = true;

		const meshes: ObjMesh[] = this.renderer.objectMeshes;
		const playerMesh: ObjMesh = meshes.filter(m => m.modelName === 'player')[0];
		this.scene.update(meshes, playerMesh);
		this.renderer.render(this.scene.get_renderables(), this.scene.camera.get_position());

		const lastCamPosition: Vec3 = this.scene.camera.position;
		this.scene.lastPlayerPos = this.scene.player.position;
		this.scene.lastCamPosition = lastCamPosition;

		this.scene.move_player_FB(this.moveVec[0]);
		this.scene.move_player_LR(this.moveVec[1]);

		// Get distance/direction moved vector from last frame
		const moveDeltaVector = vecA_minus_vecB(this.scene.camera.position, lastCamPosition);
		this.scene.moveDeltaVector = moveDeltaVector;
		this.scene.playerMoving = false;

		if (this.moveVec[0] !== 0 || this.moveVec[1] !== 0) {
			this.scene.playerMoving = true;
			this.scene.player.set_rotation(Math.atan2(moveDeltaVector[1], moveDeltaVector[0]) * (180 / Math.PI), 1);
		}
		(document.getElementById('fps_counter') as HTMLElement).innerText = (~~(
			1000 / window.myLib.deltaTime
		)).toString();

		if (running) {
			this.timeStamp = Date.now();

			setTimeout(() => {
				requestAnimationFrame(this.run);
				window.myLib.deltaTime = Date.now() - this.timeStamp;
			}, this.loopWaitTime);
		}
	};

	handleKeyDown(e: KeyboardEvent) {
		if (!this.pointerLocked) return;

		if (e.code === 'KeyW') {
			this.moveVec[0] = 1;
		} else if (e.code === 'KeyS') {
			this.moveVec[0] = -1;
		}

		if (e.code === 'KeyA') {
			this.moveVec[1] = -1;
		} else if (e.code === 'KeyD') {
			this.moveVec[1] = 1;
		}
	}

	handleKeyUp(e: KeyboardEvent) {
		if (!this.pointerLocked) return;

		switch (e.code) {
			case 'KeyW':
				this.moveVec[0] = 0;
				break;
			case 'KeyS':
				this.moveVec[0] = 0;
				break;
			case 'KeyA':
				this.moveVec[1] = 0;
				break;
			case 'KeyD':
				this.moveVec[1] = 0;
				break;
		}
	}

	handleMouseMove(e: MouseEvent) {
		if (!this.pointerLocked) return;

		this.scene.spin_player(-(e.movementX / 20), -(e.movementY / 20));
	}

	handleMouseDown(e: MouseEvent) {
		this.lockPointer();
	}

	handleScrollWheel(e: WheelEvent) {
		if (!this.pointerLocked) return;

		this.scene.camDistFromPlayer += e.deltaY / 500;
	}

	lockPointer() {
		if (document.pointerLockElement !== this.canvas) {
			this.canvas.requestPointerLock =
				this.canvas.requestPointerLock ||
				//@ts-expect-error
				this.canvas.mozRequestPointerLock ||
				//@ts-expect-error
				this.canvas.webkitRequestPointerLock;

			//@ts-expect-error
			const promise = this.canvas.requestPointerLock({ unadjustedMovement: true });

			//@ts-expect-error
			if (!promise) {
				console.log('Disabling mouse acceleration is not supported');
				return this.canvas.requestPointerLock();
			}

			return (
				promise
					//@ts-expect-error
					.then(() => console.log('Pointer is locked'))
					//@ts-expect-error
					.catch(err => {
						if (err.name === 'NotSupportedError') {
							return this.canvas.requestPointerLock();
						}
					})
			);
		}
	}
}
