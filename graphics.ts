const CANVAS = document.getElementById("screen") as HTMLCanvasElement | null;
if (CANVAS === null) throw new Error("Could not find canvas");

const gl = CANVAS.getContext('webgl');
if (gl === null) throw new Error("Could not find webgl context");

function compile(gl: WebGLRenderingContext, vshader: string, fshader: string) {
    // Compile vertex shader
    var vs = gl.createShader(gl.VERTEX_SHADER);
    if (vs == null) { return; }
    gl.shaderSource(vs, vshader);
    gl.compileShader(vs);
    
    // Compile fragment shader
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (fs == null) { return; }
    gl.shaderSource(fs, fshader);
    gl.compileShader(fs);
    
    // Create and launch the WebGL program
    var program = gl.createProgram();
    if (program == null) { return; }
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

var vshader = `
precision mediump float;
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

var fshader =`
precision mediump float;
varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
}
`

var program = compile(gl, vshader, fshader)
if (program == null) { throw new Error('Could not compile program') }

var position = gl.getAttribLocation(program, 'position')
var color = gl.getAttribLocation(program, 'color')
if (position == -1 || color == -1) {
    throw new Error('Could not retrieve attribute locations')
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

function rad2deg(rad: number) {
    return rad * (180 / Math.PI)
}

function randRange(min: number, max: number) {
    return Math.random() * (max - min) + min
}

function map(number: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
}

// HSL TO RGB
// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion

function hue2RGB(p: number, q: number, t: number) {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p+(q-p)*6*t
    if (t < 1/2) return q
    if (t < 2/3) return p+(q-p)*(2/3-t)*6

    return p;
}

function HSL2RGB(h: number, s: number, l: number) {
    let r: number, g: number, b: number;

    if (s === 0) {
        r = g = b = l
    } else {
        const q = l<0.5 ? l*(1+s) : l+s-l*s
        const p = 2*l-q

        r = hue2RGB(p, q, h + 1/3)
        g = hue2RGB(p, q, h)
        b = hue2RGB(p, q, h - 1/3)
    }

    return [r, g, b]
}

function startAnimation(gl: WebGLRenderingContext, program: WebGLProgram) {
    var timePrev = 0

    var Tx = 0
    var Ty = 0
    var B = 0
    var S = 1

    function frame(timeStart: number) {
        var deltaTime = timeStart - timePrev
        console.log('fps:', 1000 / deltaTime)
        timePrev = timeStart
        var n = 3
        var rSpeed = deg2rad(180) / 1000

        var randMin = 0
        var randMax = 0

        var y1 = 0.5 + randRange(randMin, randMax)
        var x1 = 0.0 + randRange(randMin, randMax)
        var p1C = HSL2RGB((Math.sin(timeStart/1000) + 1)/2, 1, 0.5)
        var [r1, g1, b1] = p1C
        
        var x2 = 0.5 + randRange(randMin, randMax)
        var y2 = -0.5 + randRange(randMin, randMax)
        var p2C = HSL2RGB((((Math.sin(timeStart/1000) + 1)/2)+1/3)%1, 1, 0.5)
        var [r2, g2, b2] = p2C

        var x3 = -0.5 + randRange(randMin, randMax)
        var y3 = -0.5 + randRange(randMin, randMax)
        var p3C = HSL2RGB((((Math.sin(timeStart/1000) + 1)/2)-1/3)%1, 1, 0.5)
        var [r3, g3, b3] = p3C

        var verticesColors = new Float32Array([
        /* x,    y,    z,   r,   g,   b */
             x1,  y1,  0.0, r1,  g1,  b1,
             x2,  y2,  0.0, r2,  g2,  b2,
             x3,  y3,  0.0, r3,  g3,  b3,  
        ])

        var FSIZE = verticesColors.BYTES_PER_ELEMENT

        var buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW)

        gl.vertexAttribPointer(
            position,
            3,
            gl.FLOAT,
            false,
            FSIZE * 6,
            0
        )
        gl.enableVertexAttribArray(position)

        gl.vertexAttribPointer(
            color,
            3,
            gl.FLOAT,
            false,
            FSIZE * 6,
            FSIZE * 3
        )
        gl.enableVertexAttribArray(color)

        var translation = gl.getUniformLocation(program, 'translation')
        var rotation = gl.getUniformLocation(program, 'rotation')
        var scale = gl.getUniformLocation(program, 'scale')
        if (translation == null || rotation == null || scale == null) {
            throw new Error(`Could not retrieve uniform locations, translation: ${translation}, rotation: ${rotation}, scale: ${scale}`)
        }

        B += rSpeed * deltaTime
        S = (Math.sin(timeStart / 1000))
        Tx = (Math.sin(timeStart / 1000)) / 2
        Ty = (Math.cos(timeStart / 1000)) / 2

        var t_matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            Tx,  Ty,  0.0, 1.0
        ])

        var cosB = Math.cos(B)
        var sinB = Math.sin(B)
        var r_matrix = new Float32Array([
            cosB, sinB, 0.0, 0.0,
            -sinB, cosB, 0.0, 0.0,
            0.0,   0.0, 1.0, 0.0,
            0.0,   0.0, 0.0, 1.0
        ])

        var s_matrix = new Float32Array([
            S,   0.0, 0.0, 0.0,
            0.0, S,   0.0, 0.0,
            0.0, 0.0, S,   0.0,
            0.0, 0.0, 0.0, 1.0  
        ])

        gl.uniformMatrix4fv(translation, false, t_matrix)
        gl.uniformMatrix4fv(rotation, false, r_matrix)
        gl.uniformMatrix4fv(scale, false, s_matrix)

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            n
        )

        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
}

startAnimation(gl, program)