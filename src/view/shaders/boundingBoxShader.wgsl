struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct ObjectData {
    model: array<mat4x4<f32>>,
};

struct VertIn {
    @location(0) vertexPosition: vec3f,
    @builtin(instance_index) instanceIndex: u32,
};

struct VertOut {
    @builtin(position) position: vec4f,
};

@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<storage, read> objects: ObjectData;

@vertex
fn v_main(input: VertIn) -> VertOut {
    var output: VertOut;

    output.position = transformUBO.projection * transformUBO.view * objects.model[input.instanceIndex] * vec4f(input.vertexPosition, 1.0);

    return output;
}

@fragment
fn f_main(input: VertOut) -> @location(0) vec4f {
    return vec4f(0.0, 0.5, 0.5, 1.0);
}