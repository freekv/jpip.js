var solarConstants = {};
solarConstants.radiusMeter = 6.955e8;
solarConstants.radiusKiloMeter = solarConstants.radiusMeter / 1000.;
solarConstants.radiusOpenGL = 1.;

var canvas;
var gl;
var objectList = [];
var plottingMetadata = [];
var cubeRotation = 0.0;
var lastCubeUpdateTime = 0;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var textureCoordAttribute;
var perspectiveMatrix;
var beginDate = 0;
var endDate = 0;
var currentDate = 0;
var cadence = 25 * 60 * 1000;
var running = false;
var loop = true;

function initWebGL() {
    gl = null;
    try {
        gl = canvas.getContext("experimental-webgl");
    } catch (e) {
    }
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
}
function start() {
    canvas = document.getElementById("glcanvas");
    initWebGL(canvas);
    if (gl) {
        gl.clearColor(1.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        setInterval(function() {
            requestAnimationFrame(drawScene)
        }, 30);
    }
}

var count = 0;
var bt = Date.now();
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    perspectiveMatrix = makePerspective(90, 1024.0 / 1024.0, 0.1, 100.0);
    loadIdentity();
    mvTranslate([ -0.0, 0.0, -1.0 ]);
    mvPushMatrix();
    for (var ll = 0; ll < 2; ll++) {
        gl.viewport(ll * 512, 0, 512, 512);

        if (running) {
            currentDate += cadence;
        }
        if (currentDate > endDate && loop) {
            currentDate = beginDate;
        }

        for (var i = 0; i < objectList.length; i++) {
            object = objectList[i];
            if (!object.initialized) {
                object.init(gl);
            }
        }

        for (var i = 0; i < objectList.length; i++) {
            object = objectList[i];
            if (object.viewportIndex == ll) {
                object.prerender(gl);
            }
        }

        for (var i = 0; i < objectList.length; i++) {
            object = objectList[i];
            if (object.viewportIndex == ll) {
                object.render(perspectiveMatrix, mvMatrix, currentDate);
            }
        }

        /*
         * var currentTime = (new Date).getTime(); if (lastCubeUpdateTime) { var
         * delta = currentTime - lastCubeUpdateTime; cubeRotation += (30 *
         * delta) / 1000.0; }
         * 
         * lastCubeUpdateTime = currentTime;
         */
        for (var i = 0; i < objectList.length; i++) {
            object = objectList[i];
            object.updateGUI();
        }
        elapsed = Date.now() - bt;
        bt = Date.now();
    }
    mvPopMatrix();

}

function loadIdentity() {
    mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
    multMatrix(Matrix.Translation($V([ v[0], v[1], v[2] ])).ensure4x4());
}

function setMatrixUniforms() {
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
    if (m) {
        mvMatrixStack.push(m.dup());
        mvMatrix = m.dup();
    } else {
        mvMatrixStack.push(mvMatrix.dup());
    }
}

function mvPopMatrix() {
    if (!mvMatrixStack.length) {
        throw ("Can't pop from an empty matrix stack.");
    }

    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
}

function mvRotate(angle, v) {
    var inRadians = angle * Math.PI / 180.0;

    var m = Matrix.Rotation(inRadians, $V([ v[0], v[1], v[2] ])).ensure4x4();
    multMatrix(m);
}
