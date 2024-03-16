struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct ObjectData {
    model: array<mat4x4<f32>>,
};

struct VertIn {
    @location(0) vertexPosition: vec3f,
    @location(1) vertexTexCoord: vec2f,
    @builtin(instance_index) instanceIndex: u32,
};

struct VertOut {
    @builtin(position) position: vec4f,
    @location(0) TextCoord: vec2f,
};

// Bound for each frame
@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<storage, read> objects: ObjectData;

// Bound for each material
@group(1) @binding(0) var myTexture: texture_2d<f32>;
@group(1) @binding(1) var mySampler: sampler;

@vertex
fn v_main(input: VertIn) -> VertOut {
    var output: VertOut;

    output.position = transformUBO.projection * transformUBO.view * objects.model[input.instanceIndex] * vec4f(input.vertexPosition, 1.0);
    output.TextCoord = input.vertexTexCoord;

    return output;
}

@fragment
fn f_main(input: VertOut) -> @location(0) vec4f {
    return textureSample(myTexture, mySampler, vec2f(input.TextCoord.x, 1 - input.TextCoord.y));
}