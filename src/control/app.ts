import { Vec2 } from 'wgpu-matrix';
import { Scene } from '../model/scene';
import { Renderer } from '../view/renderer';

export class App {
	canvas: HTMLCanvasElement;
	renderer: Renderer;
	objectImages: string[];
	boundingBoxNames: string[];
	renderBoundingBoxes: boolean;
	scene: Scene;
	keysPressed: string[];
	moveAmtFB: number;
	moveAmtLR: number;
	moveVec: Vec2;
	timeStamp: number;
	deltaTimes: number[];
	fpsValue: string;
	fpsAvg: number;
	i: number;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.objectImages = ['house.png', 'spaceship.jpg', 'player.png', 'floor.jpg'];
		this.boundingBoxNames = ['house', 'spaceship', 'player'];
		this.renderBoundingBoxes = true;
		this.renderer = new Renderer(canvas, this.objectImages, this.boundingBoxNames, this.renderBoundingBoxes);
		this.scene = new Scene(this.objectImages, this.boundingBoxNames);
		this.fpsAvg = 0;
		this.deltaTimes = [];
		this.i = 0;

		document.addEventListener('keydown', e => this.handleKeyDown(e));
		document.addEventListener('keyup', e => this.handleKeyUp(e));
		document.addEventListener('mousemove', e => this.handleMouseMove(e));
		document.addEventListener('mousedown', e => this.handleMouseDown(e));
		document.addEventListener(
			'pointerlockchange',
			() => {
				// if (document.pointerLockElement === canvas) {
				// 	this.userIsInTab = true;
				// } else this.userIsInTab = false;
			},
			false
		);
		this.keysPressed = [];
		this.moveAmtFB = 0.1;
		this.moveAmtLR = 0.1;
		this.moveVec = [0, 0];

		this.fpsValue = <string>document.getElementById('fps_counter')?.innerText;
	}

	async initialize() {
		await this.renderer.initialize();
	}

	run = () => {
		let running: boolean = true;

		this.timeStamp = Date.now();

		this.scene.update();
		this.renderer.render(this.scene.get_renderables());

		this.scene.move_player_FB(this.moveVec[0]);
		this.scene.move_player_LR(this.moveVec[1]);

		if (this.i >= 10) {
			this.fpsAvg =
				this.deltaTimes.reduce((acc: number, num: number) => acc + num, 0) / this.deltaTimes.length;

			(document.getElementById('fps_counter') as HTMLElement).innerText =
				'10% avg: ' + (~~this.fpsAvg).toString();

			this.i = 0;
			this.deltaTimes = [];
		}

		this.deltaTimes.push(1000 / (Date.now() - this.timeStamp));
		this.i++;

		if (running) requestAnimationFrame(this.run);
	};

	handleKeyDown(e: KeyboardEvent) {
		if (e.code === 'KeyW') {
			this.moveVec[0] = this.moveAmtFB;
		} else if (e.code === 'KeyS') {
			this.moveVec[0] = -this.moveAmtFB;
		}

		if (e.code === 'KeyA') {
			this.moveVec[1] = -this.moveAmtLR;
		} else if (e.code === 'KeyD') {
			this.moveVec[1] = this.moveAmtLR;
		}
	}

	handleKeyUp(e: KeyboardEvent) {
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
		this.scene.spin_player(-(e.movementX / 20), -(e.movementY / 20));
	}

	handleMouseDown(e: MouseEvent) {
		this.lockPointer();
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
