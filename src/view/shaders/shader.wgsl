struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct ObjectData {
    model: array<mat4x4<f32>>,
};

struct LightData {
    model: array<mat4x4<f32>>,
};

struct VertIn {
    @location(0) vertexPosition: vec3f,
    @location(1) vertexTexCoord: vec2f,
    @location(2) materialIndex: f32,
    @location(3) vertexNormal: vec3f,
    @location(4) materialShininess: f32,
    @location(5) materialSpecular: vec3f,
    @location(6) materialAmbient: vec3f,
    @location(7) materialDiffuse: vec3f,
    @builtin(instance_index) instanceIndex: u32,
};

struct VertOut {
    @builtin(position) position: vec4f,
    @location(0) TextCoord: vec2f,
    @location(1) cameraPos: vec3f,
    @location(2) worldPos: vec4f,
    @location(3) @interpolate(flat) materialIndex: u32,
    @location(4) @interpolate(flat) vertexNormal: vec3f,
    @location(5) @interpolate(flat) materialShininess: f32,
    @location(6) @interpolate(flat) materialSpecular: vec3f,
    @location(7) @interpolate(flat) materialAmbient: vec3f,
    @location(8) @interpolate(flat) materialDiffuse: vec3f,
};

struct FragOut {
    @location(0) color: vec4f,
};

const fogIntensity: f32 = 0.04;
const fogColor = vec3f(0.0, 0.0, 0.0);

// Bound for each frame
@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<storage, read> objects: ObjectData;
@group(0) @binding(2) var<uniform> cameraPosition: vec3f;
@group(0) @binding(3) var<uniform> viewport: vec2f;

@group(0) @binding(4) var<storage, read> lightData: LightData;
@group(0) @binding(5) var<storage, read> lightPosition: vec3f;
@group(0) @binding(6) var<storage, read> lightBrightness: f32;
@group(0) @binding(7) var<storage, read> lightColor: vec3f;

// Bound for each material
@group(1) @binding(0) var myTexture: texture_2d_array<f32>;
@group(1) @binding(1) var mySampler: sampler;
@group(1) @binding(2) var myDepthTexture: texture_depth_2d;
@group(1) @binding(3) var myDepthSampler: sampler_comparison;

@vertex
fn v_main(input: VertIn) -> VertOut {
    var output: VertOut;
    let vertWorlPos = objects.model[input.instanceIndex] * vec4f(input.vertexPosition, 1.0);

    output.position = transformUBO.projection * transformUBO.view * vertWorlPos;
    output.TextCoord = input.vertexTexCoord;
    output.cameraPos = cameraPosition.xyz;
    output.worldPos = vertWorlPos; 
    output.materialIndex = u32(input.materialIndex);
    output.vertexNormal = input.vertexNormal;
    output.materialShininess = input.materialShininess;
    output.materialSpecular = input.materialSpecular;
    output.materialAmbient = input.materialAmbient;
    output.materialDiffuse = input.materialDiffuse;

    return output;
}

@fragment
fn f_main(input: VertOut) -> FragOut {
    var output: FragOut;

    let textureColor = textureSample(myTexture, mySampler, vec2f(input.TextCoord.x, 1 - input.TextCoord.y), input.materialIndex);
    if (textureColor.a == 0.0) {
        discard;
    }

    let distFromPlayer = abs(distance(input.worldPos.xyz, input.cameraPos));

    let fogScaler = 1 - clamp(1 / exp(pow((distFromPlayer * fogIntensity), 2)), 0, 1);

    let lightPos = vec3f(-5.0, -5.0, 10.0);
    let lightDir = normalize(lightPos - input.worldPos.xyz);
    let faceDirToCamera = normalize(input.worldPos.xyz - input.cameraPos);
    
    // let depthSample = textureSampleCompare(myDepthTexture, myDepthSampler, vec2f(input.TextCoord.x, 1 - input.TextCoord.y), 1.0);

    // Ambient
    let ka = 0.2;
    let ambientLight = textureColor.rgb * input.materialAmbient * ka;

    // Diffuse
    var diffuseColor = input.materialDiffuse;
    if (textureColor.r != 0 || textureColor.g != 0 || textureColor.b != 0) {
        diffuseColor = textureColor.rgb;
    }
    let diffuseAmt = max(0.0, dot(lightDir, input.vertexNormal));
    let diffuseLight = diffuseColor * diffuseAmt;

    // Specular
    let reflectedLight = reflect(lightDir, input.vertexNormal);
    let specularAmt = pow(max(0.0, dot(reflectedLight, faceDirToCamera)), input.materialShininess);
    let specularLight = specularAmt * input.materialSpecular;

    let finalLight = ambientLight + diffuseLight + specularLight;

    let finalWithFog = mix(finalLight, fogColor, fogScaler);

    output.color = vec4f(finalWithFog, textureColor.a);
    
    return output;
}