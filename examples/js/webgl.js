var solarConstants = {};
solarConstants.radiusMeter = 6.955e8;
solarConstants.radiusKiloMeter = solarConstants.radiusMeter / 1000.;
solarConstants.radiusOpenGL = 1.;

var core;

_core = function() {
    _core.prototype.canvas;
    _core.prototype.objectList = [];
    _core.prototype.plottingMetadata = [];
    _core.prototype.cubeRotation = 0.0;
    _core.prototype.lastCubeUpdateTime = 0;
    _core.prototype.mvMatrix;
    _core.prototype.shaderProgram;
    _core.prototype.vertexPositionAttribute;
    _core.prototype.textureCoordAttribute;
    _core.prototype.perspectiveMatrix;
    _core.prototype.beginDate = 0;
    _core.prototype.endDate = 0;
    _core.prototype.currentDate = 0;
    _core.prototype.cadence = 25 * 60 * 1000;
    _core.prototype.running = false;
    _core.prototype.loop = true;
    _core.prototype.viewport;
    _core.prototype.count = 0;
    _core.prototype.bt = Date.now();
    _core.prototype.elapsed;
    _core.prototype.mvMatrixStack = [];
    _core.prototype.gl = null;
}

_core.prototype.initWebGL = function() {
    try {
        _core.prototype.gl = _core.prototype.canvas.getContext("experimental-webgl");
    } catch (e) {
    }
    if (!_core.prototype.gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
}
_core.prototype.start = function() {
    _core.prototype.canvas = document.getElementById("glcanvas");
    _core.prototype.initWebGL(_core.prototype.canvas);
    if (_core.prototype.gl) {
        _core.prototype.gl.clearColor(1.0, 0.0, 0.0, 1.0);
        _core.prototype.gl.clearDepth(1.0);
        _core.prototype.gl.enable(_core.prototype.gl.DEPTH_TEST);
        _core.prototype.gl.depthFunc(_core.prototype.gl.LEQUAL);
        setInterval(function() {
            requestAnimationFrame(_core.prototype.drawScene)
        }, 30);
    }
}

_core.prototype.drawScene = function() {
    _core.prototype.gl.clear(_core.prototype.gl.COLOR_BUFFER_BIT | _core.prototype.gl.DEPTH_BUFFER_BIT);
    _core.prototype.perspectiveMatrix = makePerspective(90, 1024.0 / 1024.0, 0.1, 100.0);
    _core.prototype.loadIdentity();
    _core.prototype.mvTranslate([ -0.0, 0.0, -1.0 ]);
    _core.prototype.mvPushMatrix();
    var vcl = _core.prototype.viewport.totalWidth / _core.prototype.viewport.columns;
    var vrl = _core.prototype.viewport.totalHeight / _core.prototype.viewport.rows;

    for (var ll = 0; ll < _core.prototype.viewport.columns; ll++) {
        for (var rr = 0; rr < _core.prototype.viewport.rows; rr++) {
            var index = _core.prototype.viewport.columns * (_core.prototype.viewport.rows - 1 - rr) + ll;
            _core.prototype.gl.viewport(ll * vcl, rr * vrl, vcl, vrl);

            if (_core.prototype.running) {
                _core.prototype.currentDate += _core.prototype.cadence;
            }
            if (_core.prototype.currentDate > _core.prototype.endDate && _core.prototype.loop) {
                _core.prototype.currentDate = _core.prototype.beginDate;
            }

            for (var i = 0; i < _core.prototype.objectList.length; i++) {
                var object = _core.prototype.objectList[i];
                if (!object.initialized) {
                    object.init(_core.prototype.gl);
                }
            }

            for (var i = 0; i < _core.prototype.objectList.length; i++) {
                var object = _core.prototype.objectList[i];
                if (object.viewportIndices.indexOf(index) !== -1) {
                    object.prerender(_core.prototype.gl);
                }
            }

            for (var i = 0; i < _core.prototype.objectList.length; i++) {
                var object = _core.prototype.objectList[i];
                if (object.viewportIndices.indexOf(index) !== -1) {
                    object.render(_core.prototype.gl, _core.prototype.perspectiveMatrix, _core.prototype.mvMatrix, _core.prototype.currentDate);
                }
            }

            for (var i = 0; i < _core.prototype.objectList.length; i++) {
                var object = _core.prototype.objectList[i];
                object.updateGUI();
            }
            _core.prototype.elapsed = Date.now() - _core.prototype.bt;
            _core.prototype.bt = Date.now();
        }
    }
    _core.prototype.mvPopMatrix();

}

_core.prototype.loadIdentity = function() {
    _core.prototype.mvMatrix = Matrix.I(4);
}

_core.prototype.multMatrix = function(m) {
    _core.prototype.mvMatrix = _core.prototype.mvMatrix.x(m);
}

_core.prototype.mvTranslate = function(v) {
    this.multMatrix(Matrix.Translation($V([ v[0], v[1], v[2] ])).ensure4x4());
}

_core.prototype.mvPushMatrix = function(m) {
    if (m) {
        _core.prototype.mvMatrixStack.push(m.dup());
        _core.prototype.mvMatrix = m.dup();
    } else {
        _core.prototype.mvMatrixStack.push(_core.prototype.mvMatrix.dup());
    }
}

_core.prototype.mvPopMatrix = function() {
    if (!_core.prototype.mvMatrixStack.length) {
        throw ("Can't pop from an empty matrix stack.");
    }

    _core.prototype.mvMatrix = _core.prototype.mvMatrixStack.pop();
    return _core.prototype.mvMatrix;
}

_core.prototype.mvRotate = function(angle, v) {
    var inRadians = angle * Math.PI / 180.0;

    var m = Matrix.Rotation(inRadians, $V([ v[0], v[1], v[2] ])).ensure4x4();
    multMatrix(m);
}

document.addEventListener("DOMContentLoaded", function(event) {
    base_url = "http://swhv.oma.be/hv/";
    var success = function(data) {
        var vgui = new gui();
        vgui.initGui(data);
        var vviewport = new viewport();
        vviewport.initGui();
        core = new _core();
        _core.prototype.viewport = vviewport;
        _core.prototype.gui = vgui;
        core.start();
    };
    getJSON(base_url + "api/?action=getDataSources&verbose=true&enable=[STEREO_A,STEREO_B,PROBA2]", success, success);
});