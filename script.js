const canvas = document.getElementById("screen");
const gl = canvas.getContext("webgl");

compile = (gl, vshader, fshader) => {
  
  // Compile vertex shader
  var vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vshader);
  gl.compileShader(vs);
  
  // Compile fragment shader
  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fshader);
  gl.compileShader(fs);
  
  // Create and launch the WebGL program
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);
  
  // Log errors (optional)
  console.log('vertex shader:', gl.getShaderInfoLog(vs) || 'OK');
  console.log('fragment shader:', gl.getShaderInfoLog(fs) || 'OK');
  console.log('program:', gl.getProgramInfoLog(program) || 'OK');
  
  return program;
}

buffer = (gl, data, program, attribute, size, type) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  var a = gl.getAttribLocation(program, attribute);
  gl.vertexAttribPoint(a, size, type, false, 0, 0);
  gl.enableVertexAttribArray(a);
}

transpose = m => {
  return new DOMMatrix([
    m.m11, m.m21, m.m31, m.m41,
    m.m12, m.m22, m.m32, m.m42,
    m.m13, m.m23, m.m33, m.m43,
    m.m14, m.m24, m.m34, m.m44
  ])
}

rotate = (rx, ry, rz, ox, oy, oz) => {
  var ret = new DOMMatrix();
  return ret.translateSelf(-ox, -oy, -oz).rotateSelf(rx, ry, rz).translateSelf(ox, oy, oz) 
}

var vshader = `
attribute vec4 position;
uniform mat4 translation;
uniform mat4 rotation;
uniform mat4 scale;
attribute vec4 color;
varying vec4 v_color;

void main() {
  gl_Position = (scale * (rotation * translation)) * position;
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
var program = compile(gl, vshader, fshader)

var position = gl.getAttribLocation(program, 'position');
var color = gl.getUniformLocation(program, 'color');
var translation = gl.getUniformLocation(program, 'translation')
var rotation = gl.getUniformLocation(program, 'rotation')
var scale = gl.getUniformLocation(program, 'scale')

gl.uniform4f(color, 1.0, 0.0, 0.0, 1.0);

var verticesColors = new Float32Array([
//x,     y,   z,  r,   g,   b
  0,     0.5, 0,  0.0, 1.0, 0.0,
  -0.5, -0.5, 0,  0.0, 0.0, 1.0,
  0.5,  -0.5, 0,  1.0, 0.0, 0.0
]);

var Tx = 0.2;
var Ty = -.1;
var t_matrix = new Float32Array([
  1.0, 0.0, 0.0, 0.0,
  0.0, 1.0, 0.0, 0.0,
  0.0, 0.0, 1.0, 0.0,
  Tx,  Ty, 0.0, 1.0,
])

gl.uniformMatrix4fv(translation, false, t_matrix)

var B = 1;
var cosB = Math.cos(B);
var sinB = Math.sin(B);
var r_matrix = new Float32Array([
  cosB,  sinB, 0.0, 0.0,
  -sinB, cosB, 0.0, 0.0,
  0.0,   0.0,  1.0, 0.0,
  0.0,   0.0,  0.0, 1.0
]);
gl.uniformMatrix4fv(rotation, false, r_matrix);

var S = 1.2;
var s_matrix = new Float32Array([
  S,   0.0, 0.0, 0.0,
  0.0, S,   0.0, 0.0,
  0.0, 0.0, S,   0.0,
  0.0, 0.0, 0.0, 1.0
]);
gl.uniformMatrix4fv(scale, false, s_matrix);
gl.uniformMatrix4fv()

var n = 3;
var FSIZE = verticesColors.BYTES_PER_ELEMENT;

gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

var position = gl.getAttribLocation(program, 'position');
gl.vertexAttribPointer(
  position,
  3,
  gl.FLOAT,
  false,
  FSIZE * 6,
  0
);

gl.enableVertexAttribArray(position);

var color = gl.getAttribLocation(program, 'color');
gl.vertexAttribPointer(
  color,
  3,
  gl.FLOAT,
  false,
  FSIZE * 6,
  FSIZE * 3
)
gl.enableVertexAttribArray(color);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.drawArrays(
  gl.TRIANGLES,
  0,
  n
);