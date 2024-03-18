import { Vec3 } from 'wgpu-matrix';
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
	const v1: Float32Array = one_four_by_four_four(vertices.slice(0, 3), modelTransform);
	const v2: Float32Array = one_four_by_four_four(vertices.slice(3, 6), modelTransform);
	const v3: Float32Array = one_four_by_four_four(vertices.slice(6, 9), modelTransform);
	const v4: Float32Array = one_four_by_four_four(vertices.slice(9, 12), modelTransform);
	const v5: Float32Array = one_four_by_four_four(vertices.slice(12, 15), modelTransform);
	const v6: Float32Array = one_four_by_four_four(vertices.slice(15, 18), modelTransform);
	const v7: Float32Array = one_four_by_four_four(vertices.slice(18, 21), modelTransform);
	const v8: Float32Array = one_four_by_four_four(vertices.slice(21, 24), modelTransform);

	return new Float32Array([...v1, ...v2, ...v3, ...v4, ...v5, ...v6, ...v7, ...v8]);
}

export function player_object_collision(
	playerVertices: Float32Array,
	playerTransform: Float32Array,
	modelVertices: Float32Array,
	modelTransform: Float32Array
): boolean {
	const transformedPlayerVertices: Float32Array = get_transformed_cuboid_vertices(
		playerVertices,
		playerTransform
	);
	const playerCenter: Vec3 = get_cuboid_center(transformedPlayerVertices);

	for (let i: number = 0; i < modelVertices.length; i += 8 * 3) {
		const transformedVertices: Float32Array = get_transformed_cuboid_vertices(
			modelVertices.slice(i, i + 24),
			modelTransform
		);

		const modelCenter: Vec3 = get_cuboid_center(transformedVertices);

		// Just need to now check intersection of player diagonals from center
		// against other object's planes, and vice versa

		// Need to use the face ("f") lines in .obj file
		// to determine the specific vertices for each face
	}
	return false;
}
