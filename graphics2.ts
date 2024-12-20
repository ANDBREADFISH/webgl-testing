const CANVAS2 = document.getElementById("screen2") as HTMLCanvasElement | null;
if (CANVAS2 === null) throw new Error("Could not find CANVAS2");

var gl2 = CANVAS2.getContext('webgl');
if (gl2 === null) throw new Error("Could not find webgl2 context");

function compile(gl2: WebGLRenderingContext, vshader: string, fshader: string) {
    // Compile vertex shader
    var vs = gl2.createShader(gl2.VERTEX_SHADER);
    if (vs == null) { return; }
    gl2.shaderSource(vs, vshader);
    gl2.compileShader(vs);
    
    // Compile fragment shader
    var fs = gl2.createShader(gl2.FRAGMENT_SHADER);
    if (fs == null) { return; }
    gl2.shaderSource(fs, fshader);
    gl2.compileShader(fs);
    
    // Create and launch the WebGL program
    var program = gl2.createProgram();
    if (program == null) { return; }
    gl2.attachShader(program, vs);
    gl2.attachShader(program, fs);
    gl2.linkProgram(program);
    gl2.useProgram(program);
    
    // Log errors (optional)
    console.log('2vertex shader:', gl2.getShaderInfoLog(vs) || 'OK');
    console.log('2fragment shader:', gl2.getShaderInfoLog(fs) || 'OK');
    console.log('2program:', gl2.getProgramInfoLog(program) || 'OK');
    
    return program;
}

interface perspectiveOptions {
    fov?: number
    ratio: number
    near: number
    far: number
}

function perspective(options: perspectiveOptions) {
    var fov = options.fov || 85
    fov = fov * Math.PI / 180
    var aspect = options.ratio
    var near = options.near
    var far = options.far
    var f = 1 / Math.tan(fov)
    var nf = 1 / (near - far)
    return new DOMMatrix([
        f / aspect, 0, 0,                     0,
        0,          f, 0,                     0,
        0,          0, (far + near) * nf,    -1,
        0,          0, (2 * near * far) * nf, 0
    ])
}

function lookAt(cameraX: number, cameraY: number, cameraZ: number, targetX: number, targetY: number, targetZ: number, upX = 0, upY = 1, upZ = 0) {
    var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;
    fx = targetX - cameraX
    fy = targetY - cameraY
    fz = targetZ - cameraZ
    rlf = 1 / Math.hypot(fx, fy, fz)
    fx *= rlf
    fy *= rlf
    fz *= rlf
    sx = fy * upZ - fz * upY
    sy = fz * upX - fx * upZ
    sz = fx * upY - fy * upX
    rls = 1 / Math.hypot(sx, sy, sz)
    sx *= rls
    sy *= rls
    sz *= rls
    ux = sy * fz - sz * fy
    uy = sz * fx - sx * fz
    uz = sx * fy - sy * fx
    var ret = new DOMMatrix([
        sx, ux, -fx, 0,
        sy, uy, -fy, 0,
        sz, uz, -fz, 0,
        0,  0,  0,   1
    ])

    return ret.translateSelf(-cameraX, -cameraY, -cameraZ)
}

var vshader = `
precision mediump float;
attribute vec4 position;
attribute vec4 color;
uniform mat4 camera;
varying vec4 v_color;

void main() {
    gl_Position = camera * position;
    v_color = color;
}
`

var fshader =`
precision mediump float;
varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
}
`

var program = compile(gl2, vshader, fshader)
if (program == null) { throw new Error('Could not compile program') }

/* cube 

  v6-------v5
 /|        /|
v1--------v0|
| |       | |
| |v7-----|-|v4
|/        |/
v2--------v3
*/

var verticesColors = new Float32Array([
     1.0,  1.0,  1.0,    1.0, 1.0, 1.0, //v0, white
    -1.0,  1.0,  1.0,    1.0, 0.0, 1.0, //v1, magenta
    -1.0, -1.0,  1.0,    1.0, 0.0, 0.0, //v2, red
     1.0, -1.0,  1.0,    1.0, 1.0, 0.0, //v3, yellow
     1.0, -1.0, -1.0,    0.0, 1.0, 0.0, //v4, green
     1.0,  1.0, -1.0,    0.0, 1.0, 1.0, //v5, cyan
    -1.0,  1.0, -1.0,    0.0, 0.0, 1.0, //v6, blue
    -1.0, -1.0, -1.0,    0.0, 0.0, 0.0  //v7, black
])

var indices = new Uint8Array([
    0, 1, 2,  0, 2, 3, //font
    0, 3, 4,  0, 4, 5, //right
    0, 5, 6,  0, 6, 1, //up
    1, 6, 7,  1, 7, 2, //left
    7, 4, 3,  7, 3, 2, //down
    4, 7, 6,  4, 6, 5  //back
])

var n = 36;

var vertexColorBuffer = gl2.createBuffer();
gl2.bindBuffer(gl2.ARRAY_BUFFER, vertexColorBuffer)
gl2.bufferData(gl2.ARRAY_BUFFER, verticesColors, gl2.STATIC_DRAW)

var indexBuffer = gl2.createBuffer()
gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, indices, gl2.STATIC_DRAW)

var FSIZE = verticesColors.BYTES_PER_ELEMENT

var position = gl2.getAttribLocation(program, 'position')
if (position == -1) { throw new Error('Could not find position location') }
gl2.vertexAttribPointer(position, 3, gl2.FLOAT, false, FSIZE * 6, 0)
gl2.enableVertexAttribArray(position)

var color = gl2.getAttribLocation(program, 'color')
if (color == -1) { throw new Error('Could not find color location')}
gl2.vertexAttribPointer(color, 3, gl2.FLOAT, false, FSIZE * 6, FSIZE * 3)
gl2.enableVertexAttribArray(color)

gl2.clearColor(0.0, 0.0, 0.0, 1.0)
gl2.enable(gl2.DEPTH_TEST)

var camera = gl2.getUniformLocation(program, 'camera')
if (camera == null) { throw new Error('Could not find camera location') }
var cameraMatrix = perspective({fov: 30, ratio: 1, near: 1, far: 100})
cameraMatrix.translateSelf(0, 0, -5)

function animation3D(gl2: WebGLRenderingContext) {

    function frame3D() {
    cameraMatrix.rotateSelf(.4, .8, .4)
    gl2.uniformMatrix4fv(camera, false, cameraMatrix.toFloat32Array())
    gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT)
    gl2.drawElements(gl2.LINE_LOOP, n, gl2.UNSIGNED_BYTE, 0)

    requestAnimationFrame(frame3D)
    }

    requestAnimationFrame(frame3D)
}

animation3D(gl2)