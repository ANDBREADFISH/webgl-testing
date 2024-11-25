const CANVAS3 = document.getElementById('screen3') as HTMLCanvasElement | null
if (CANVAS3 == null) { throw new Error('Could not find CANVAS3') }
var gl3 = CANVAS3.getContext('webgl')
if (gl3 == null) { throw new Error('Could not find webgl context') }

function compile(gl3: WebGLRenderingContext, vshader: string, fshader: string) {
    // Compile vertex shader
    var vs = gl3.createShader(gl3.VERTEX_SHADER);
    if (vs == null) { return; }
    gl3.shaderSource(vs, vshader);
    gl3.compileShader(vs);
    
    // Compile fragment shader
    var fs = gl3.createShader(gl3.FRAGMENT_SHADER);
    if (fs == null) { return; }
    gl3.shaderSource(fs, fshader);
    gl3.compileShader(fs);
    
    // Create and launch the WebGL program
    var program = gl3.createProgram();
    if (program == null) { return; }
    gl3.attachShader(program, vs);
    gl3.attachShader(program, fs);
    gl3.linkProgram(program);
    gl3.useProgram(program);
    
    // Log errors (optional)
    console.log('3vertex shader:', gl3.getShaderInfoLog(vs) || 'OK');
    console.log('3fragment shader:', gl3.getShaderInfoLog(fs) || 'OK');
    console.log('3program:', gl3.getProgramInfoLog(program) || 'OK');
    
    return program;
}

function buffer(gl3: WebGLRenderingContext, data: Float32Array, program: WebGLProgram, attribute: string, size: number, type: number) {
    gl3.bindBuffer(gl3.ARRAY_BUFFER, gl3.createBuffer())
    gl3.bufferData(gl3.ARRAY_BUFFER, data, gl3.STATIC_DRAW)
    var a = gl3.getAttribLocation(program, attribute)
    if (a == -1) { throw new Error('Could not find attribute: '+attribute)}
    gl3.vertexAttribPointer(a, size, type, false, 0, 0)
    gl3.enableVertexAttribArray(a)
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

var fshader = `
precision mediump float;
varying vec4 v_color;
void main() {
    gl_FragColor = v_color;
}
`

var program = compile(gl3, vshader, fshader)
if (program == null) { throw new Error('Could not compile program') }

var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // back
])

var colors = new Float32Array([
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0, // front (purple)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4, // right (green)
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4, // up    (red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4, // left  (yellow)
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // down  (white)
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0  // back  (blue)
])

var indices = new Uint8Array([
    0,  1,  2,   0,  2,  3,  // front
    4,  5,  6,   4,  6,  7,  // right
    8,  9,  10,  8,  10, 11, // up
    12, 13, 14,  12, 14, 15, // left
    16, 17, 18,  16, 18, 19, // down
    20, 21, 22,  20, 22, 23  // back
])

var n = 36

buffer(gl3, vertices, program, 'position', 3, gl3.FLOAT)
buffer(gl3, colors, program, 'color', 3, gl3.FLOAT)

var indexBuffer = gl3.createBuffer()
gl3.bindBuffer(gl3.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl3.bufferData(gl3.ELEMENT_ARRAY_BUFFER, indices, gl3.STATIC_DRAW)

gl3.clearColor(0.0, 0.0, 0.0, 1.0)
gl3.enable(gl3.DEPTH_TEST)

var camera = gl3.getUniformLocation(program, 'camera')
if (camera == null) { throw new Error('Could not find camera') }
var cameraMatrix = perspective({fov: 30, ratio: 1, near: 1, far: 100})
cameraMatrix.translateSelf(0, 0, -5)

setInterval(() => {
    if (gl3 == null) { throw new Error('webgl3 context is null') }
    cameraMatrix.rotateSelf(.4, .8, .4)
    gl3.uniformMatrix4fv(camera, false, cameraMatrix.toFloat32Array())
    gl3.clear(gl3.COLOR_BUFFER_BIT | gl3.DEPTH_BUFFER_BIT)
    gl3.drawElements(gl3.TRIANGLES, n, gl3.UNSIGNED_BYTE, 0)
}, 16)