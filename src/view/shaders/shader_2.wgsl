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
    @location(1) worldPos: vec4f,
    @location(2) @interpolate(flat) materialIndex: u32,
    @location(3) @interpolate(flat) vertexNormal: vec3f,
    @location(4) @interpolate(flat) materialShininess: f32,
    @location(5) @interpolate(flat) materialSpecular: vec3f,
    @location(6) @interpolate(flat) materialAmbient: vec3f,
    @location(7) @interpolate(flat) materialDiffuse: vec3f,
};

struct FragOut {
    @location(0) color: vec4f,
};

const fogIntensity: f32 = 0.04;
const fogColor = vec3f(0.0, 0.0, 0.0);
const lightFalloff: f32 = 20.0;

// Bound for each frame
@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<storage, read> objects: ObjectData;
@group(0) @binding(2) var<uniform> cameraPosition: vec3f;
@group(0) @binding(3) var<uniform> viewport: vec2f;

@group(0) @binding(4) var<storage, read> lightPositionValues: array<vec3f>;
@group(0) @binding(5) var<storage, read> lightBrightnessValues: array<f32>;
@group(0) @binding(6) var<storage, read> lightColorValues: array<vec3f>;
@group(0) @binding(7) var<storage, read> lightWorldPositions: array<vec3f>;
@group(0) @binding(8) var<storage, read> normalMatrices: array<mat4x4<f32>>;

// Bound for each material
@group(1) @binding(0) var myTexture: texture_2d_array<f32>;
@group(1) @binding(1) var mySampler: sampler;
@group(1) @binding(2) var myDepthTexture: texture_depth_2d;
@group(1) @binding(3) var myDepthSampler: sampler_comparison;

fn extractMat3FromMat4(m: mat4x4<f32>) -> mat3x3<f32> {
    return mat3x3(
        m[0].xyz,
        m[1].xyz,
        m[2].xyz
    );
}

@vertex
fn v_main(input: VertIn) -> VertOut {
    var output: VertOut;
    let vertWorldPos = objects.model[input.instanceIndex] * vec4f(input.vertexPosition, 1.0);

    output.position = transformUBO.projection * transformUBO.view * vertWorldPos;
    output.TextCoord = input.vertexTexCoord;
    output.worldPos = vertWorldPos; 
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

    let lightPos = vec3f(-5.0, -15.0, 5.0);
    let lightBrightness = 2.0;
    let lightColor = vec3f(1.0, 1.0, 0.8);

    let distFromPlayer = abs(distance(input.worldPos.xyz, cameraPosition));

    // Ambient
    let ka = 0.15;
    let ambientLight = textureColor.rgb * input.materialAmbient * ka;

    let lightDist = abs(distance(lightPos, input.worldPos.xyz));

    let lightRadius: f32 = 30.0 * lightBrightness;

    var s = lightDist / lightRadius;
    if s > 1 { s = 1; }

    let lightIntensityAdjustment = lightBrightness * (pow(1 - s * s, 2) / (1 + lightFalloff * (s * s)));

    let lightDir = normalize(lightPos - input.worldPos.xyz);
    let faceDirToCamera = normalize(input.worldPos.xyz - cameraPosition);
    
    // Diffuse
    var diffuseColor = input.materialDiffuse;
    if (textureColor.r != 0 || textureColor.g != 0 || textureColor.b != 0) {
        diffuseColor = textureColor.rgb * lightColor;
    }
    
    let diffuseAmt = (max(0.0, dot(lightDir, input.vertexNormal))) * lightIntensityAdjustment;
    let diffuseLight = diffuseColor * diffuseAmt;

    // Specular
    let reflectedLight = reflect(lightDir, input.vertexNormal);
    let specularAmt = pow(max(0.0, dot(reflectedLight, faceDirToCamera)), input.materialShininess) * lightIntensityAdjustment;
    let specularLight = specularAmt * input.materialSpecular;

    let finalLight = ambientLight + diffuseLight + specularLight;

    output.color = vec4f(finalLight, textureColor.a);
    
    return output;
}