struct TransformData {
    view: mat4x4f,
    projection: mat4x4f,
};

struct ObjectData {
    model: array<mat4x4f>,
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
    @location(8) materialDissolve: f32,
    @builtin(instance_index) instanceIndex: u32,
};

struct VertOut {
    @builtin(position) position: vec4f,
    @location(0) TextCoord: vec2f,
    @location(1) worldPos: vec4f,
    @location(2) @interpolate(flat) materialIndex: i32,
    @location(3) @interpolate(flat) vertexNormal: vec3f,
    @location(4) @interpolate(flat) materialShininess: f32,
    @location(5) @interpolate(flat) materialSpecular: vec3f,
    @location(6) @interpolate(flat) materialAmbient: vec3f,
    @location(7) @interpolate(flat) materialDiffuse: vec3f,
    @location(8) @interpolate(flat) materialDissolve: f32,
};

struct FragOut {
    @location(0) color: vec4f,
};

const pi: f32 = 3.14159265359;

const fogIntensity: f32 = 0.0;
const fogColor = vec3f(0.0, 0.0, 0.0);
const lightFalloff: f32 = 30.0;
const lightRadialFalloff: f32 = 2.0;

// Bound for each frame
@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<storage, read> objects: ObjectData;
@group(0) @binding(2) var<uniform> cameraPosition: vec3f;
@group(0) @binding(3) var<uniform> viewport: vec2f;

@group(0) @binding(4) var<storage, read> lightBrightnessValues: array<f32>;
@group(0) @binding(5) var<storage, read> lightColorValues: array<vec3f>;
@group(0) @binding(6) var<storage, read> lightTypeValues: array<f32>;
@group(0) @binding(7) var<storage, read> lightDirectionValues: array<vec3f>;
@group(0) @binding(8) var<storage, read> lightLimitValues: array<f32>;
@group(0) @binding(9) var<storage, read> lightWorldPositions: array<vec3f>;
@group(0) @binding(10) var<storage, read> normalMatrices: array<mat4x4f>;
@group(0) @binding(11) var shadowDepthTexture: texture_depth_2d_array;
@group(0) @binding(12) var shadowDepthSampler: sampler_comparison;
@group(0) @binding(13) var<storage, read> lightViewProjectionMat: array<mat4x4f>;

// Bound for each material
@group(1) @binding(0) var myTexture: texture_2d_array<f32>;
@group(1) @binding(1) var mySampler: sampler;

fn extractMat3FromMat4(m: mat4x4f) -> mat3x3f {
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
    output.vertexNormal = extractMat3FromMat4(normalMatrices[input.instanceIndex]) * input.vertexNormal;
    output.materialIndex = i32(input.materialIndex);
    output.materialShininess = input.materialShininess;
    output.materialSpecular = input.materialSpecular;
    output.materialAmbient = input.materialAmbient;
    output.materialDiffuse = input.materialDiffuse;
    output.materialDissolve = input.materialDissolve;

    return output;
}

@fragment
fn f_main(input: VertOut) -> FragOut {
    var output: FragOut;

    let hasTexture: bool = input.materialIndex >= 0;

    let textureColor = textureSample(myTexture, mySampler, vec2f(input.TextCoord.x, 1 - input.TextCoord.y), abs(input.materialIndex));
    // output.color = textureColor;

    let distFromPlayer = abs(distance(input.worldPos.xyz, cameraPosition));

    let fogScaler = 1 - clamp(1 / exp(pow((distFromPlayer * fogIntensity), 2)), 0, 1);

    // Ambient
    // let ka = 0.1;
    let ka = 0.25;
    var ambientLight: vec3f = input.materialAmbient * ka;
    if (hasTexture) {
        if (textureColor.a == 0.0) { discard; }
        ambientLight *= textureColor.rgb;
    }

    var finalLight: vec3f = vec3f(0.0, 0.0, 0.0);

    for (var i: u32 = 0; i < arrayLength(&lightWorldPositions); i++) {
        let lightDist = abs(distance(lightWorldPositions[i], input.worldPos.xyz));

        let lightRadius: f32 = 20.0 * lightBrightnessValues[i];

        let s = lightDist / lightRadius;
        // if (s >= 1.0) { 
        //     i++;
        //     continue; 
        // }

        // Shadows ------------------
        
        var visibility = 0.0;
        var posFromLight = lightViewProjectionMat[i] * input.worldPos;
        posFromLight /= posFromLight.w;
        let shadowPos = vec3f(posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5), posFromLight.z);

        let oneOverShadowDepthTextureSize = 1.0 / 1024.0;
        for (var y = -1; y <= 1; y++) {
            for (var x = -1; x <= 1; x++) {
                let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;

                visibility += textureSampleCompare(
                    shadowDepthTexture, shadowDepthSampler,
                    shadowPos.xy + offset, i, shadowPos.z - 0.0000
                );
            }
        }

        visibility /= 9.0;

        // --------------------------

        var surfaceToLightDir = normalize(lightWorldPositions[i] - cameraPosition);
        var spotLightFalloff = 1.0;
        var lightIntensityAdjustment = visibility * lightBrightnessValues[i];

        if (lightTypeValues[i] == 0) {        // If spot light
            surfaceToLightDir = normalize(lightWorldPositions[i] - input.worldPos.xyz);
            let dotFromDir = dot(surfaceToLightDir, normalize(-lightDirectionValues[i]));
            let lightLimit = 1 - (lightLimitValues[i] / 2) / pi;
            let percentAlongLightRadius = (1 - dotFromDir) / (1 - lightLimit);

            if (dotFromDir <= lightLimit) {
                // i++;
                // continue;
                spotLightFalloff = 0.0;
            } else {
                spotLightFalloff = pow(1 - percentAlongLightRadius, lightRadialFalloff);
            }

            lightIntensityAdjustment *= spotLightFalloff * (pow(1 - s * s, 2) / (1 + lightFalloff * (s * s)));
        }

        let faceDirToCamera = normalize(input.worldPos.xyz - cameraPosition);

        // Diffuse
        var diffuseColor = input.materialDiffuse * lightColorValues[i];
        if (hasTexture && (textureColor.r != 0 || textureColor.g != 0 || textureColor.b != 0)) {
            diffuseColor = textureColor.rgb * lightColorValues[i];
        }
        
        let diffuseAmt = (max(0.0, dot(surfaceToLightDir, input.vertexNormal))) * lightIntensityAdjustment;
        let diffuseLight = diffuseColor * diffuseAmt;

        // Specular
        let reflectedLight = reflect(surfaceToLightDir, input.vertexNormal);
        let specularAmt = pow(max(0.0, dot(reflectedLight, faceDirToCamera)), input.materialShininess) * lightIntensityAdjustment;
        let specularLight = specularAmt * input.materialSpecular * diffuseColor;

        finalLight += diffuseLight + specularLight;
    }

    let finalWithFog = mix(finalLight + ambientLight, fogColor, fogScaler);
    // let finalWithAmbient = finalLight + ambientLight;

    var transparency = input.materialDissolve;
    if (hasTexture) { transparency = textureColor.a; }

    output.color = vec4f(finalWithFog, transparency);
    
    return output;
}