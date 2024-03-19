import { Vec3, Vec4 } from 'wgpu-matrix';
import {
	cross,
	dot,
	normalize,
	num_vec_multiply,
	vecA_divide_by_vecB,
	vecA_minus_vecB,
	vecAdd,
} from './math_stuff';
import { one_four_by_four_four } from './matrices';

function get_cuboid_center(vertices: Float32Array): Vec3 {
	let sum: Vec3 = [0, 0, 0];
	for (let i: number = 0; i < vertices.length; i += 3) {
		sum[0] += vertices[i];
		sum[1] += vertices[i + 1];
		sum[2] += vertices[i + 2];
	}
	return [sum[0] / 8, sum[1] / 8, sum[2] / 8];
}

function get_transformed_cuboid_vertices(vertices: Float32Array, modelTransform: Float32Array): Float32Array {
	const newArr: number[] = [];

	for (let i: number = 0; i < vertices.length; i += 3) {
		newArr.push(...one_four_by_four_four(vertices.slice(i, i + 3), modelTransform));
	}

	return new Float32Array(newArr);
}

function line_plane_collision_test(
	center: Vec3,
	objVertices1: Float32Array,
	objVertices2: Float32Array
): Vec3 | false {
	// Check objVertices1 diagonals against objVertices2 planes
	for (let i: number = 0; i < objVertices1.length; i += 3) {
		// Interate diagonals

		const diagVertex: Vec3 = [objVertices1[i], objVertices1[i + 1], objVertices1[i + 2]];
		// Ray vector
		const diagVector: Vec3 = vecA_minus_vecB(diagVertex, center);

		for (let j: number = 0; j < objVertices2.length; j += 12) {
			// Iterate planes

			// Only need 3 verts (v1/v2/v4) to calculate plane normal
			const v1: Vec3 = [objVertices2[j], objVertices2[j + 1], objVertices2[j + 2]];
			const v2: Vec3 = [objVertices2[j + 3], objVertices2[j + 4], objVertices2[j + 5]];
			const v3: Vec3 = [objVertices2[j + 6], objVertices2[j + 7], objVertices2[j + 8]];
			const v4: Vec3 = [objVertices2[j + 9], objVertices2[j + 10], objVertices2[j + 11]];

			// Plane normal (d = scaler)
			const nA: number = v1[1] * (v2[2] - v3[2]) + v2[1] * (v3[2] - v1[2]) + v3[1] * (v1[2] - v2[2]);
			const nB: number = v1[2] * (v2[0] - v3[0]) + v2[2] * (v3[0] - v1[0]) + v3[2] * (v1[0] - v2[0]);
			const nC: number = v1[0] * (v2[1] - v3[1]) + v2[0] * (v3[1] - v1[1]) + v3[0] * (v1[1] - v2[1]);
			const d: number =
				-v1[0] * (v2[1] * v3[2] - v3[1] * v2[2]) -
				v2[0] * (v3[1] * v1[2] - v1[1] * v3[2]) -
				v3[0] * (v1[1] * v2[2] - v2[1] * v1[2]);

			// Plane intersection equation
			const tNumer: number = -(nA * center[0] + nB * center[1] + nC * center[2] + d);
			const tDenom: number = nA * diagVector[0] + nB * diagVector[1] + nC * diagVector[1];
			const t: number = tNumer / tDenom;

			if (t >= 0 && t <= 1) {
				const intersection: Vec3 = [
					center[0] + diagVector[0] * t,
					center[1] + diagVector[1] * t,
					center[2] + diagVector[2] * t,
				];

				const vec1N: Vec3 = normalize(vecA_minus_vecB(v1, v2));
				const vec2N: Vec3 = normalize(vecA_minus_vecB(v4, v1));
				const vec3N: Vec3 = normalize(vecA_minus_vecB(v3, v4));
				const vec4N: Vec3 = normalize(vecA_minus_vecB(v2, v3));

				const intersectionN1: Vec3 = normalize(vecA_minus_vecB(v2, intersection));
				const intersectionN2: Vec3 = normalize(vecA_minus_vecB(v1, intersection));
				const intersectionN3: Vec3 = normalize(vecA_minus_vecB(v4, intersection));
				const intersectionN4: Vec3 = normalize(vecA_minus_vecB(v3, intersection));

				const dot1: number = dot(intersectionN1, vec1N);
				const dot2: number = dot(intersectionN2, vec2N);
				const dot3: number = dot(intersectionN3, vec3N);
				const dot4: number = dot(intersectionN4, vec4N);

				if (dot1 <= 0 && dot2 <= 0 && dot3 <= 0 && dot4 <= 0) {
					// const offsetVec: Vec3 = vecA_minus_vecB(diagVertex, intersection);
					return normalize([nA, nB, nC]);
				}
			}
		}
	}

	return false;
}

export function player_object_collision(
	pVertices: Float32Array,
	pVerticesGrouped: Float32Array,
	playerTransform: Float32Array,
	modelVertices: Float32Array,
	modelVerticesGrouped: Float32Array,
	modelTransform: Float32Array
): Vec3 | false {
	const transformedPvertices: Float32Array = get_transformed_cuboid_vertices(pVertices, playerTransform);
	const transformedPverticesGrouped: Float32Array = get_transformed_cuboid_vertices(
		pVerticesGrouped,
		playerTransform
	);
	const playerCenter: Vec3 = get_cuboid_center(transformedPvertices);

	let g_index: number = 0;
	for (let i: number = 0; i < modelVertices.length; i += 24) {
		// Check each bounding box for current model
		const transformedMvertices: Float32Array = get_transformed_cuboid_vertices(
			modelVertices.slice(i, i + 24),
			modelTransform
		);
		// Grouped vertices 3 times as many vertices
		const transformedMverticesGrouped: Float32Array = get_transformed_cuboid_vertices(
			modelVerticesGrouped.slice(g_index, g_index + 24 * 3),
			modelTransform
		);

		const modelCenter: Vec3 = get_cuboid_center(transformedMvertices);

		// Just need to now check intersection of player diagonals from center
		// against other object's planes, and vice versa
		const objectPlaneNormal: Vec3 | false = line_plane_collision_test(
			playerCenter,
			transformedPvertices,
			transformedMverticesGrouped
		);

		if (objectPlaneNormal) return objectPlaneNormal;

		const playerPlaneNormal: Vec3 | false = line_plane_collision_test(
			modelCenter,
			transformedMvertices,
			transformedPverticesGrouped
		);

		if (playerPlaneNormal) return num_vec_multiply(-1, playerPlaneNormal);

		g_index += 24 * 3;
	}

	return false;
}
