import { Mat3, Mat4 } from 'wgpu-matrix';

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

// export function invert_matrix(m: Float32Array): Float32Array {
// 	const A2323 = m[10] * m[15] - m[11] * m[14];
// 	const A1323 = m[9] * m[15] - m[11] * m[13];
// 	const A1223 = m[9] * m[14] - m[10] * m[13];
// 	const A0323 = m[8] * m[15] - m[11] * m[12];
// 	const A0223 = m[8] * m[14] - m[10] * m[12];
// 	const A0123 = m[8] * m[13] - m[9] * m[12];
// 	const A2313 = m[6] * m[15] - m[7] * m[14];
// 	const A1313 = m[5] * m[15] - m[7] * m[13];
// 	const A1213 = m[5] * m[14] - m[6] * m[13];
// 	const A2312 = m[6] * m[11] - m[7] * m[10];
// 	const A1312 = m[5] * m[11] - m[7] * m[9];
// 	const A1212 = m[5] * m[10] - m[6] * m[9];
// 	const A0313 = m[4] * m[15] - m[7] * m[12];
// 	const A0213 = m[4] * m[14] - m[6] * m[12];
// 	const A0312 = m[4] * m[11] - m[7] * m[8];
// 	const A0212 = m[4] * m[10] - m[6] * m[8];
// 	const A0113 = m[4] * m[13] - m[5] * m[12];
// 	const A0112 = m[4] * m[9] - m[5] * m[8];

// 	let det =
// 		m[0] * (m[5] * A2323 - m[6] * A1323 + m[7] * A1223) -
// 		m[1] * (m[4] * A2323 - m[6] * A0323 + m[7] * A0223) +
// 		m[2] * (m[4] * A1323 - m[5] * A0323 + m[7] * A0123) -
// 		m[3] * (m[4] * A1223 - m[5] * A0223 + m[6] * A0123);
// 	det = 1 / det;

// 	return new Float32Array([
// 		det * (m[5] * A2323 - m[6] * A1323 + m[7] * A1223),
// 		det * -(m[1] * A2323 - m[2] * A1323 + m[3] * A1223),
// 		det * (m[1] * A2313 - m[2] * A1313 + m[3] * A1213),
// 		det * -(m[1] * A2312 - m[2] * A1312 + m[3] * A1212),
// 		det * -(m[4] * A2323 - m[6] * A0323 + m[7] * A0223),
// 		det * (m[0] * A2323 - m[2] * A0323 + m[3] * A0223),
// 		det * -(m[0] * A2313 - m[2] * A0313 + m[3] * A0213),
// 		det * (m[0] * A2312 - m[2] * A0312 + m[3] * A0212),
// 		det * (m[4] * A1323 - m[5] * A0323 + m[7] * A0123),
// 		det * -(m[0] * A1323 - m[1] * A0323 + m[3] * A0123),
// 		det * (m[0] * A1313 - m[1] * A0313 + m[3] * A0113),
// 		det * -(m[0] * A1312 - m[1] * A0312 + m[3] * A0112),
// 		det * -(m[4] * A1223 - m[5] * A0223 + m[6] * A0123),
// 		det * (m[0] * A1223 - m[1] * A0223 + m[2] * A0123),
// 		det * -(m[0] * A1213 - m[1] * A0213 + m[2] * A0113),
// 		det * (m[0] * A1212 - m[1] * A0212 + m[2] * A0112),
// 	]);
// }

export function transpose(m: Mat4): Mat3 {
	const m00 = m[0 * 4 + 0];
	const m01 = m[0 * 4 + 1];
	const m02 = m[0 * 4 + 2];
	const m03 = m[0 * 4 + 3];
	const m10 = m[1 * 4 + 0];
	const m11 = m[1 * 4 + 1];
	const m12 = m[1 * 4 + 2];
	const m13 = m[1 * 4 + 3];
	const m20 = m[2 * 4 + 0];
	const m21 = m[2 * 4 + 1];
	const m22 = m[2 * 4 + 2];
	const m23 = m[2 * 4 + 3];
	const m30 = m[3 * 4 + 0];
	const m31 = m[3 * 4 + 1];
	const m32 = m[3 * 4 + 2];
	const m33 = m[3 * 4 + 3];

	return new Float32Array([m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33]);
}

export function inverse(m: Mat4): Mat3 {
	const m00 = m[0 * 4 + 0];
	const m01 = m[0 * 4 + 1];
	const m02 = m[0 * 4 + 2];
	const m03 = m[0 * 4 + 3];
	const m10 = m[1 * 4 + 0];
	const m11 = m[1 * 4 + 1];
	const m12 = m[1 * 4 + 2];
	const m13 = m[1 * 4 + 3];
	const m20 = m[2 * 4 + 0];
	const m21 = m[2 * 4 + 1];
	const m22 = m[2 * 4 + 2];
	const m23 = m[2 * 4 + 3];
	const m30 = m[3 * 4 + 0];
	const m31 = m[3 * 4 + 1];
	const m32 = m[3 * 4 + 2];
	const m33 = m[3 * 4 + 3];
	const tmp0 = m22 * m33;
	const tmp1 = m32 * m23;
	const tmp2 = m12 * m33;
	const tmp3 = m32 * m13;
	const tmp4 = m12 * m23;
	const tmp5 = m22 * m13;
	const tmp6 = m02 * m33;
	const tmp7 = m32 * m03;
	const tmp8 = m02 * m23;
	const tmp9 = m22 * m03;
	const tmp10 = m02 * m13;
	const tmp11 = m12 * m03;
	const tmp12 = m20 * m31;
	const tmp13 = m30 * m21;
	const tmp14 = m10 * m31;
	const tmp15 = m30 * m11;
	const tmp16 = m10 * m21;
	const tmp17 = m20 * m11;
	const tmp18 = m00 * m31;
	const tmp19 = m30 * m01;
	const tmp20 = m00 * m21;
	const tmp21 = m20 * m01;
	const tmp22 = m00 * m11;
	const tmp23 = m10 * m01;

	const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
	const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
	const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
	const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

	const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

	return new Float32Array([
		d * t0,
		d * t1,
		d * t2,
		d * t3,
		d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30)),
		d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30)),
		d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30)),
		d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20)),
		d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33)),
		d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33)),
		d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33)),
		d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23)),
		d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22)),
		d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02)),
		d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12)),
		d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02)),
	]);
}
