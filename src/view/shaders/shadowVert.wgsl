@group(0) @binding(0) var<storage, read> modelMat: array<mat4x4f>;
@group(0) @binding(1) var<storage, read> lightViewProjectionMat: array<mat4x4f>;
@group(0) @binding(2) var<uniform> lightIndex: u32;

struct Input {
    @builtin(instance_index) idx: u32,
    @location(0) vertexPosition: vec3f,
};

@vertex
fn vs_main(in: Input) -> @builtin(position) vec4f {
    let vertWorldPos = modelMat[in.idx] * vec4f(in.vertexPosition, 1.0);
    return lightViewProjectionMat[0] * vertWorldPos;
}