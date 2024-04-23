import { Vec3, vec3 } from 'wgpu-matrix';

export function degToRad(theta: number) {
	return (theta * Math.PI) / 180;
}

export function normalize(v: Vec3, dst?: Vec3): Vec3 {
	dst = dst || [];

	const v0 = v[0];
	const v1 = v[1];
	const v2 = v[2];
	const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);

	if (len > 0.00001) {
		dst[0] = v0 / len;
		dst[1] = v1 / len;
		dst[2] = v2 / len;
	} else {
		dst[0] = 0;
		dst[1] = 0;
		dst[2] = 0;
	}

	return dst;
}

export function dot(a: Vec3, b: Vec3): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3, dst?: Vec3): Vec3 {
	dst = dst || [];

	const t1 = a[2] * b[0] - a[0] * b[2];
	const t2 = a[0] * b[1] - a[1] * b[0];
	dst[0] = a[1] * b[2] - a[2] * b[1];
	dst[1] = t1;
	dst[2] = t2;

	return dst;
}

export function vecA_minus_vecB(a: Vec3, b: Vec3): Vec3 {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vecAdd(a: Vec3, b: Vec3): Vec3 {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vec_multiply(a: Vec3, b: Vec3): Vec3 {
	return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
}

export function vecA_divide_by_vecB(a: Vec3, b: Vec3): Vec3 {
	return [a[0] / b[0], a[1] / b[1], a[2] / b[2]];
}

export function num_vec_multiply(a: number, b: Vec3): Vec3 {
	return [a * b[0], a * b[1], a * b[2]];
}

export function num_divide_by_vec(a: number, b: Vec3): Vec3 {
	return [a / b[0], a / b[1], a / b[2]];
}

export function vec3_mean(vecs: Vec3[]): Vec3 {
	const vecNum: number = vecs.length;
	const newVec: Vec3 = vecs[0];

	if (vecNum === 1) return newVec;

	for (let i: number = 1; i < vecs.length; i++) {
		newVec[0] += vecs[i][0];
		newVec[1] += vecs[i][1];
		newVec[2] += vecs[i][2];
	}

	return [newVec[0] / vecNum, newVec[1] / vecNum, newVec[2] / vecNum];
}

export function convertTo2dArray(arr: Float32Array): Vec3[] {
	const arrTemp: Vec3[] = [];

	for (let i = 0; i < arr.length; i += 3) {
		arrTemp.push([arr[i], arr[i + 1], arr[i + 2]]);
	}

	return arrTemp;
}
