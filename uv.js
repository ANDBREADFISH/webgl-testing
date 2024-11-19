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
attribute vec2 texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = position;
  v_texCoord = texCoord;
}
`

var fshader = `
precision mediump float;
uniform sampler2D sampler;
varying vec2 v_texCoord;

void main() {
  gl_FragColor = texture2D(sampler, v_texCoord);
}
`
var program = compile(gl, vshader, fshader)

var verticesTexCoords = new Float32Array([
  -0.5,  0.5,  0.0,  1.0,
  -0.5, -0.5,  0.0,  0.0,
   0.5,  0.5,  1.0,  1.0,
   0.5, -0.5,  1.0,  0.0,
])

var n = 4;
var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

var vertexTexCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer)
gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW)

var position = gl.getAttribLocation(program, 'position');
gl.vertexAttribPointer(
  position,
  2,
  gl.FLOAT,
  false,
  FSIZE * 4,
  0
);

gl.enableVertexAttribArray(position);

var texCoord = gl.getAttribLocation(program, 'texCoord');
gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
gl.enableVertexAttribArray(texCoord);

gl.clearColor(0.0, 0.0, 0.0, 1.0);

var texture = gl.createTexture();
var sampler = gl.getUniformLocation(program, 'sampler');
var image = new Image();
image.crossOrigin = 'anonymous';
image.src = './stellated_octahedron.png'
image.onload = function() {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  console.log(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S));
  console.log(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T));
  console.log(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER));

  gl.uniform1i(sampler, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
  
}