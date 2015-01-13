var solarConstants = {};

solarConstants.radiusMeter = 6.955e8;
solarConstants.radiusKiloMeter = solarConstants.radiusMeter / 1000.;
solarConstants.radiusOpenGL = 1.;

_core = function() {
    this.canvas;
    this.objectList = [];
    this.plottingMetadata = [];
    this.cubeRotation = 0.0;
    this.lastCubeUpdateTime = 0;
    this.mvMatrix;
    this.shaderProgram;
    this.vertexPositionAttribute;
    this.textureCoordAttribute;
    this.perspectiveMatrix;
    this.beginDate = 0;
    this.endDate = 0;
    this.currentDate = 0;
    this.cadence = 25 * 60 * 1000;
    this.running = false;
    this.loop = true;
    this.viewport;
    this.count = 0;
    this.bt = Date.now();
    this.elapsed;
    this.mvMatrixStack = [];
    this.gl = null;
    this.zoom = {};
    this.projectionMatrix = {};
    this.mouseMatrix = {};
    this.viewMatrix = {};
    this.viewProjectionMatrix = {};
    this.phi = 0.;
    this.theta = 0.;
    for (var i = 0; i < 16; i++) {
        this.zoom[i] = 1.0;
        this.viewMatrix[i] = Matrix.I(4);
        this.mouseMatrix[i] = Matrix.I(4);
        this.projectionMatrix[i] = Matrix.I(4);
        this.computeProjectionMatrix(i);
    }
    this.stepForward = false;
    this.stepBackward = false;

}
_core.prototype.computeProjectionMatrix = function(index) {
    this.projectionMatrix[index] = Matrix.I(4);
    var r = 1. * this.zoom[index];
    var t = 1. * this.zoom[index];
    var f = 100.;
    var n = 0.1;
    this.projectionMatrix[index].elements[0][0] = 1. / r;
    this.projectionMatrix[index].elements[1][1] = 1. / t;
    this.projectionMatrix[index].elements[2][2] = -2. / (f - n);
    this.projectionMatrix[index].elements[2][3] = -(f + n) / (f - n);
}
var core = new _core();

core.initWebGL = function() {
    try {
        core.gl = core.canvas.getContext("experimental-webgl");
    } catch (e) {
        alert(e);
    }
    if (!core.gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
}
var fff = 0;

core.start = function() {
    core.canvas = document.getElementById("glcanvas");
    core.initWebGL(core.canvas);
    if (core.gl) {
        core.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        core.gl.clearDepth(1.0);
        core.gl.enable(core.gl.DEPTH_TEST);
        core.gl.depthFunc(core.gl.LEQUAL);
        setInterval(function() {
            requestAnimationFrame(core.drawScene)
        }, 30);
    }
}
core.getViewMatrix = function(mode, date) {
    var M, M1, M2, V;
    V = $V([ 0, 0, -10. ]);

    if (mode === '3D') {

        var phi = getL0Radians(date) + core.phi;
        var theta = getB0Radians(date) + core.theta;

        M1 = Matrix.Rotation(-theta, $V([ 1, 0, 0 ]));
        M2 = Matrix.Rotation(phi, $V([ 0, 1, 0 ]));
        M = M2.x(M1);
        V = M.x(V);
        // M = M.ensure4x4();
        M = M.ensure4x4().inverse();
        M = M.x(Matrix.Translation($V([ V.elements[0], V.elements[1], V.elements[2] ])).ensure4x4());
    } else {
        M = Matrix.I(4);
        M = M.x(Matrix.Translation($V([ V.elements[0], V.elements[1], V.elements[2] ])).ensure4x4());
    }
    return M;
}
core.drawScene = function() {
    core.gl.clear(core.gl.COLOR_BUFFER_BIT | core.gl.DEPTH_BUFFER_BIT);

    var vcl = core.viewport.totalWidth / core.viewport.columns;
    var vrl = core.viewport.totalHeight / core.viewport.rows;
    for (var ll = 0; ll < core.viewport.columns; ll++) {
        for (var rr = 0; rr < core.viewport.rows; rr++) {
            var index = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
            // core.perspectiveMatrix = makePerspective(90 * core.zoom[index],
            // 1024.0 / 1024.0, 0.1, 100.0);

            /*
             * r = 1. * core.zoom[index]; t = 1. * core.zoom[index]; f = 100.; n =
             * 0.1; core.mvMatrix.elements[0][0] = 1. / r;
             * core.mvMatrix.elements[1][1] = 1. / t;
             * core.mvMatrix.elements[2][2] = -2. / (f - n);
             * core.mvMatrix.elements[2][3] = -(f + n) / (f - n);
             */

            // core.multMatrix(core.viewMatrix[index]);
            // core.mvRotate(fff, [ 1.0, 0.0, 0.0 ]);
            var mode = core.viewport.modes[index];
            var curdate = new Date(core.currentDate);
            core.viewMatrix[index] = core.getViewMatrix(mode, curdate);

            core.viewProjectionMatrix[index] = core.projectionMatrix[index].x(core.viewMatrix[index]);
            core.viewProjectionMatrix[index] = core.viewProjectionMatrix[index].x(core.mouseMatrix[index]);

            // core.mvRotate(fff, [ 1.0, 0.0, 0.0 ]);
            // fff++;

            core.gl.viewport(ll * vcl, rr * vrl, vcl, vrl);

            if (core.running || core.stepForward) {
                core.currentDate += core.cadence;
                core.stepForward = false;
            }
            if (core.stepBackward) {
                core.currentDate -= core.cadence;
                core.stepBackward = false;
            }
            if (core.currentDate < core.beginDate) {
                core.currentDate = core.beginDate;
            }
            if (core.currentDate > core.endDate && core.loop) {
                core.currentDate = core.beginDate;
            }

            for (var i = 0; i < core.objectList.length; i++) {
                var object = core.objectList[i];
                if (!object.initialized) {
                    object.init(core.gl);
                }
            }

            for (var i = 0; i < core.objectList.length; i++) {
                var object = core.objectList[i];
                object.prerender(core.gl);
            }

            for (var i = 0; i < core.objectList.length; i++) {
                var object = core.objectList[i];
                if (object.viewportIndices.indexOf(index) !== -1 && object.supportedModes.indexOf(core.viewport.modes[index]) !== -1) {
                    object.render(core.gl, core.viewProjectionMatrix[index], core.currentDate, index);
                }
            }

            for (var i = 0; i < core.objectList.length; i++) {
                var object = core.objectList[i];
                object.updateGUI();
            }
            core.elapsed = Date.now() - core.bt;
            core.bt = Date.now();

        }
    }
    var indicatorElement = document.getElementById("videoIndicator");
    indicatorElement.style.left = indicatorElement.parentNode.clientWidth * (core.currentDate - core.beginDate) / (core.endDate - core.beginDate);
    indicatorElement.setAttribute("data-tips", formatDate(new Date(core.currentDate)));
}

core.loadIdentity = function() {
    core.mvMatrix = Matrix.I(4);
}

core.multMatrix = function(m) {
    core.mvMatrix = core.mvMatrix.x(m);
}

core.mvTranslate = function(v) {
    this.multMatrix(Matrix.Translation($V([ v[0], v[1], v[2] ])).ensure4x4());
}

core.mvPushMatrix = function(m) {
    if (m) {
        core.mvMatrixStack.push(m.dup());
        core.mvMatrix = m.dup();
    } else {
        core.mvMatrixStack.push(core.mvMatrix.dup());
    }
}

core.mvPopMatrix = function() {
    if (!core.mvMatrixStack.length) {
        throw ("Can't pop from an empty matrix stack.");
    }

    core.mvMatrix = core.mvMatrixStack.pop();
    return core.mvMatrix;
}

core.mvRotate = function(angle, v) {
    var inRadians = angle * Math.PI / 180.0;

    var m = Matrix.Rotation(inRadians, $V([ v[0], v[1], v[2] ])).ensure4x4();
    this.multMatrix(m);
}

document.addEventListener("DOMContentLoaded", function(event) {
    base_url = "http://swhv.oma.be/hv/";
    var success = function(data) {
        var vgui = new gui();
        vgui.initGui(data);
        var vviewport = new viewport();
        vviewport.initGui();
        core.viewport = vviewport;
        core.gui = vgui;
        core.start();
        core.canvas.onmousedown = handleMouseDown;
        document.onmouseup = handleMouseUp;
        document.onmousemove = handleMouseMove;
        core.canvas.onmousewheel = handleMouseWheel;

    };
    getJSON(base_url + "api/?action=getDataSources&verbose=true&enable=[STEREO_A,STEREO_B,PROBA2]", success, success);
});
