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
    @location(2) vertexNormal: vec3f,
    @builtin(instance_index) instanceIndex: u32,
};

struct VertOut {
    @builtin(position) position: vec4f,
    @location(0) TextCoord: vec2f,
    @location(1) playerPos: vec3f,
    @location(2) worldPos: vec4f,

};

struct FragOut {
    @location(0) color: vec4f,
};

const fogIntensity: f32 = 0.05;
const fogColor = vec3f(0.0, 0.0, 0.0);

// Bound for each frame
@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<storage, read> objects: ObjectData;
@group(0) @binding(2) var<uniform> playerPosition: vec3f;
@group(0) @binding(3) var<uniform> viewport: vec2f;

// Bound for each material
@group(1) @binding(0) var myTexture: texture_2d<f32>;
@group(1) @binding(1) var mySampler: sampler;
@group(1) @binding(2) var myDepthTexture: texture_depth_2d;
@group(1) @binding(3) var myDepthSampler: sampler_comparison;

@vertex
fn v_main(input: VertIn) -> VertOut {
    var output: VertOut;
    let vertWorlPos = objects.model[input.instanceIndex] * vec4f(input.vertexPosition, 1.0);

    output.position = transformUBO.projection * transformUBO.view * vertWorlPos;
    output.TextCoord = input.vertexTexCoord;
    output.playerPos = playerPosition.xyz;
    output.worldPos = vertWorlPos; 

    return output;
}

@fragment
fn f_main(input: VertOut) -> FragOut {
    var output: FragOut;

    let textureColor = textureSample(myTexture, mySampler, vec2f(input.TextCoord.x, 1 - input.TextCoord.y));

    let distFromPlayer = abs(distance(input.worldPos.xyz, input.playerPos));

    let fogScaler = 1 - clamp(1 / exp(pow((distFromPlayer * fogIntensity), 2)), 0, 1);
    
    let finalColor = mix(textureColor.rgb, fogColor, fogScaler);

    // let depthSample = textureSampleCompare(myDepthTexture, myDepthSampler, vec2f(input.TextCoord.x, 1 - input.TextCoord.y), 1.0);

    output.color = vec4f(finalColor, textureColor.a);
    
    return output;
}