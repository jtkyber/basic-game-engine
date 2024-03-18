export function one_four_by_four_four(vertex: Float32Array, modelTransform: Float32Array): Float32Array {
	const v1: number = vertex[0];
	const v2: number = vertex[1];
	const v3: number = vertex[2];
	const v4: number = 1;

	const m1_1: number = modelTransform[0];
	const m1_2: number = modelTransform[1];
	const m1_3: number = modelTransform[2];
	// const m1_4: number = modelTransform[3];
	const m2_1: number = modelTransform[4];
	const m2_2: number = modelTransform[5];
	const m2_3: number = modelTransform[6];
	// const m2_4: number = modelTransform[7];
	const m3_1: number = modelTransform[8];
	const m3_2: number = modelTransform[9];
	const m3_3: number = modelTransform[10];
	// const m3_4: number = modelTransform[11];
	const m4_1: number = modelTransform[12];
	const m4_2: number = modelTransform[13];
	const m4_3: number = modelTransform[14];
	// const m4_4: number = modelTransform[15];

	const col1: number = v1 * m1_1 + v2 * m2_1 + v3 * m3_1 + v4 * m4_1;
	const col2: number = v1 * m1_2 + v2 * m2_2 + v3 * m3_2 + v4 * m4_2;
	const col3: number = v1 * m1_3 + v2 * m2_3 + v3 * m3_3 + v4 * m4_3;

	return new Float32Array([col1, col2, col3]);
}
