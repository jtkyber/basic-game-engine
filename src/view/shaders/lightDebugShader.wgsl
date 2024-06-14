struct TransformData {
    view: mat4x4f,
    projection: mat4x4f,
};

@group(0) @binding(0) var<storage, read> inverseLightViewProjectionMat: array<mat4x4f>;
@group(0) @binding(1) var<uniform> transformUBO: TransformData;

@vertex
fn v_main(@builtin(vertex_index) id: u32) -> @builtin(position) vec4f {
    // let vertices = array<vec3f, 8>(
    //     vec3f(-1, -1, 0),
    //     vec3f(1, -1, 0),
    //     vec3f(1, 1, 0),
    //     vec3f(-1, 1, 0),
    //     vec3f(-1, -1, 1),
    //     vec3f(1, -1, 1),
    //     vec3f(1, 1, 1),
    //     vec3f(-1, 1, 1)
    // );
        
    // let vertices = array<vec3f, 36> (
    //     vec3f(-1, 1, 1), vec3f(-1, 0, 1), vec3f(1, 0, 1), 
    //     vec3f(-1, 1, 1), vec3f(1, 0, 1), vec3f(1, 1, 1), 
    //     vec3f(1, 1, -1), vec3f(1, 1, 1), vec3f(1, 0, 1), 
    //     vec3f(1, 1, -1), vec3f(1, 0, 1), vec3f(1, 0, -1), 
    //     vec3f(1, 0, -1), vec3f(1, 0, 1), vec3f(-1, 0, 1), 
    //     vec3f(1, 0, -1), vec3f(-1, 0, 1), vec3f(-1, 0, -1), 
    //     vec3f(-1, 0, -1), vec3f(-1, 1, -1), vec3f(1, 1, -1), 
    //     vec3f(-1, 0, -1), vec3f(1, 1, -1), vec3f(1, 0, -1), 
    //     vec3f(-1, 1, -1), vec3f(-1, 1, 1), vec3f(1, 1, 1), 
    //     vec3f(-1, 1, -1), vec3f(1, 1, 1), vec3f(1, 1, -1), 
    //     vec3f(-1, 0, -1), vec3f(-1, 0, 1), vec3f(-1, 1, 1), 
    //     vec3f(-1, 0, -1), vec3f(-1, 1, 1), vec3f(-1, 1, -1)
    // );

     let vertices = array<vec3f, 36> (
        vec3f(-1, 1, 1), vec3f(-1, 1, 0), vec3f(1, 1, 0), 
        vec3f(-1, 1, 1), vec3f(1, 1, 0), vec3f(1, 1, 1), 
        vec3f(1, -1, 1), vec3f(1, 1, 1), vec3f(1, 1, 0), 
        vec3f(1, -1, 1), vec3f(1, 1, 0), vec3f(1, -1, 0), 
        vec3f(1, -1, 0), vec3f(1, 1, 0), vec3f(-1, 1, 0), 
        vec3f(1, -1, 0), vec3f(-1, 1, 0), vec3f(-1, -1, 0), 
        vec3f(-1, -1, 0), vec3f(-1, -1, 1), vec3f(1, -1, 1), 
        vec3f(-1, -1, 0), vec3f(1, -1, 1), vec3f(1, -1, 0), 
        vec3f(-1, -1, 1), vec3f(-1, 1, 1), vec3f(1, 1, 1), 
        vec3f(-1, -1, 1), vec3f(1, 1, 1), vec3f(1, -1, 1), 
        vec3f(-1, -1, 0), vec3f(-1, 1, 0), vec3f(-1, 1, 1), 
        vec3f(-1, -1, 0), vec3f(-1, 1, 1), vec3f(-1, -1, 1)
    );

    var worldPos = inverseLightViewProjectionMat[0] * vec4f(vertices[id], 1.0);
    worldPos /= worldPos.w;
    let pos = transformUBO.projection * transformUBO.view * worldPos;

    return pos;
    // return vec4f(vertices[id], 1.0);
}

@fragment
fn f_main() -> @location(0) vec4f {
    return vec4f(0.0, 1.0, 1.0, 1.0);
}