import { Vec2, Vec3 } from 'wgpu-matrix';
import { Scene } from '../model/scene';
import { vecA_minus_vecB } from '../utils/math_stuff';
import { ObjMesh } from '../view/obj_mesh';
import { Renderer } from '../view/renderer';

export class App {
	canvas: HTMLCanvasElement;
	renderer: Renderer;
	collisionDebug: boolean;
	lightDebug: boolean;
	scene: Scene;
	keysPressed: string[];
	moveVec: Vec2;
	pointerLocked: boolean;
	maxFramerate: number;
	fpsInterval: number;
	then: number;
	startTime: number;
	now: number;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.collisionDebug = false;
		this.lightDebug = true;

		this.pointerLocked = false;
		this.maxFramerate = 60;
		this.fpsInterval = 1000 / this.maxFramerate; // ms per frame

		this.renderer = new Renderer(this.canvas, this.collisionDebug, this.lightDebug);
		this.scene = new Scene();

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

		await this.renderer.setupDevice();
		await this.renderer.initLights();
		await this.renderer.initialize();
		const meshes: ObjMesh[] = this.renderer.objectMeshes;
		const playerMesh: ObjMesh = meshes.filter(m => m.modelName === 'player')[0];
		this.scene.set_meshes(meshes, playerMesh, this.renderer.lightMesh);
	}

	start = () => {
		this.then = performance.now();
		this.startTime = this.then;
		this.run();

		setInterval(() => {
			(document.getElementById('fps_counter') as HTMLElement).innerText = (~~(
				1000 / window.myLib.deltaTime
			)).toString();
		}, 1000);
	};

	run = () => {
		requestAnimationFrame(this.run);

		this.now = performance.now();
		window.myLib.deltaTime = this.now - this.then;

		if (window.myLib.deltaTime > this.fpsInterval) {
			this.then = this.now - (window.myLib.deltaTime % this.fpsInterval);

			this.scene.update();
			this.renderer.render(
				this.scene.get_renderables(),
				this.scene.camera.get_position(),
				this.scene.camera.forwards,
				this.scene.camera.right,
				this.scene.camera.up
			);

			const lastCamPosition: Vec3 = this.scene.camera.position;
			const lastPlayerPosition: Vec3 = this.scene.player.position;
			this.scene.lastPlayerPos = lastPlayerPosition;
			this.scene.lastCamPosition = lastCamPosition;

			this.scene.move_player_FB(this.moveVec[0]);
			this.scene.move_player_LR(this.moveVec[1]);

			// Get distance/direction moved vector from last frame
			const moveDeltaVector = vecA_minus_vecB(this.scene.camera.position, lastCamPosition);
			this.scene.moveDeltaVector = moveDeltaVector;
			this.scene.playerMoving = false;

			if (this.moveVec[0] !== 0 || this.moveVec[1] !== 0) {
				this.scene.playerMoving = true;
				this.scene.player.set_rotation(
					Math.atan2(moveDeltaVector[1], moveDeltaVector[0]) * (180 / Math.PI),
					1
				);
			}
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
