

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


function Vertex(p) {
    this.p = p;
    this.normal = [];
    this.triangles = [];
}

function Triangle(v0, v1, v2) {
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
    this.normal = [];
    this.tangent = [];
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();     // Vertex positions
    this.iUVBuffer = gl.createBuffer();         // Texture coordinates (UVs)
    this.iIndexBuffer = gl.createBuffer();      // Index buffer
    this.count = 0;

    // Load vertex, index, and optionally texture coordinate data
    this.BufferData = function (vertices, indices, uvs = null) {
        // Vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        // Optional UV buffer
        if (uvs && shProgram.iAttribTexCoord !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iUVBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW); // ONLY STATIC DRAW WORKS
            gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
        }

        // Index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);

        this.count = indices.length;
    };

    // Standard draw with textures
    this.Draw = function () {
        if (this.hasUVs && shProgram.iSampler !== undefined) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture); // Assumes a texture is assigned externally
            gl.uniform1i(shProgram.iSampler, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iUVBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    };

    // Wireframe drawing (non-textured)
    this.DrawWireframe = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);

        for (let p = 0; p < this.count; p += 3) {
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, p * 2);
        }
    };
}

function equations(r, theta) {
    let x = -(Math.cos(theta) / (2 * r)) - (Math.pow(r, 3) * Math.cos(3 * theta) / 6);
    let y = -(Math.sin(theta) / (2 * r)) + (Math.pow(r, 3) * Math.sin(3 * theta) / 6);
    let z = r * Math.cos(theta);

    return { x: x, y: y, z: z }
}

function CreatePlaneData(data) {
    let vertices = [];
    vertices.push(new Vertex([-1, -1, 0]))
    vertices.push(new Vertex([1, 1, 0]))
    vertices.push(new Vertex([1, -1, 0]))
    vertices.push(new Vertex([-1, 1, 0]))
    let triangles = [];
    triangles.push(new Triangle(0, 1, 2))
    triangles.push(new Triangle(1, 0, 3))
    data.verticesF32 = new Float32Array(vertices.length * 3);
    for (let i = 0, len = vertices.length; i < len; i++) {
        data.verticesF32[i * 3 + 0] = vertices[i].p[0];
        data.verticesF32[i * 3 + 1] = vertices[i].p[1];
        data.verticesF32[i * 3 + 2] = vertices[i].p[2];
    }
    data.indicesU16 = new Uint16Array(triangles.length * 3);
    for (let i = 0, len = triangles.length; i < len; i++) {
        data.indicesU16[i * 3 + 0] = triangles[i].v0;
        data.indicesU16[i * 3 + 1] = triangles[i].v1;
        data.indicesU16[i * 3 + 2] = triangles[i].v2;
    }
    data.uvsF32 = new Float32Array([
        1.0, 1.0, // Vertex 1: [ 1,  1, 0]
        0.0, 0.0, // Vertex 0: [-1, -1, 0]
        0.0, 1.0,  // Vertex 3: [-1,  1, 0]
        1.0, 0.0, // Vertex 2: [ 1, -1, 0]
    ]);
}



function CreateSurfaceData(data) {
    const maxR = 1
    const u = 0.1
    const v = 0.1
    const steps = parseInt(2 * Math.PI / v)

    let vertices = [];
    let triangles = [];

    for (let r = 0.25; r < maxR; r += u) {
        for (let theta = 0; theta <= 2 * Math.PI; theta += v) {
            let v1 = equations(r, theta);
            let v0ind = vertices.length;
            vertices.push(new Vertex([v1.x, v1.y, v1.z]))
            if (r > 0.25 && theta > 0) {
                let v1ind = v0ind - steps - 1;
                let v2ind = v0ind - 1;
                let v3ind = v0ind - steps;
                let trian = new Triangle(v0ind, v1ind, v2ind);
                let trianInd = triangles.length;

                triangles.push(trian);
                // vertices[v0ind].triangles.push(trianInd);
                // vertices[v1ind].triangles.push(trianInd);
                // vertices[v2ind].triangles.push(trianInd);

                let trian2 = new Triangle(v0ind, v3ind, v1ind);
                let trianInd2 = triangles.length;

                triangles.push(trian2);
                // vertices[v0ind].triangles.push(trianInd2);
                // vertices[v3ind].triangles.push(trianInd2);
                // vertices[v1ind].triangles.push(trianInd2);
            }
        }
    }

    // for (let i = 0, ang = 0; i < 72; i++, ang += 5) {
    //     vertices.push(new Vertex([Math.sin(deg2rad(ang)), 0, Math.cos(deg2rad(ang))]));
    // }

    // for (let i = 0, ang = 0; i < 72; i++, ang += 5) {

    //     let v0ind = vertices.length;
    //     vertices.push(new Vertex([Math.sin(deg2rad(ang)), 1, Math.cos(deg2rad(ang))]));

    //     // v0    v2 
    //     //   o - o
    //     //   | \ |
    //     //   o - o
    //     // v3     v1

    //     if (i > 0) {
    //         let v1ind = v0ind - 72 - 1;
    //         let v2ind = v0ind - 1;
    //         let v3ind = v0ind - 72

    //         let trian = new Triangle(v0ind, v1ind, v2ind);
    //         let trianInd = triangles.length;

    //         triangles.push(trian);
    //         vertices[v0ind].triangles.push(trianInd);
    //         vertices[v1ind].triangles.push(trianInd);
    //         vertices[v2ind].triangles.push(trianInd);

    //         let trian2 = new Triangle(v0ind, v3ind, v1ind);
    //         let trianInd2 = triangles.length;

    //         triangles.push(trian2);
    //         vertices[v0ind].triangles.push(trianInd2);
    //         vertices[v3ind].triangles.push(trianInd2);
    //         vertices[v1ind].triangles.push(trianInd2);

    //     }

    // }
    console.log(vertices)
    data.verticesF32 = new Float32Array(vertices.length * 3);
    for (let i = 0, len = vertices.length; i < len; i++) {
        data.verticesF32[i * 3 + 0] = vertices[i].p[0];
        data.verticesF32[i * 3 + 1] = vertices[i].p[1];
        data.verticesF32[i * 3 + 2] = vertices[i].p[2];
    }

    data.indicesU16 = new Uint16Array(triangles.length * 3);
    for (let i = 0, len = triangles.length; i < len; i++) {
        data.indicesU16[i * 3 + 0] = triangles[i].v0;
        data.indicesU16[i * 3 + 1] = triangles[i].v1;
        data.indicesU16[i * 3 + 2] = triangles[i].v2;
    }

}