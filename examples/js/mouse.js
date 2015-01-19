var mouseDown = false;
var lastMouse = null;
var lastPhi = 0.;
var lastTheta = 0.;
var activeIndex = 0;
getCanvasCoordinates = function(event) {
    var rect = core.canvas.getBoundingClientRect();
    var coordinates = $V([ event.clientX - rect.left, event.clientY - rect.top ]);
    return coordinates;
}
getMatrix = function() {
    return core.rotMat;
}
function handleMouseDown(event) {
    mouseDown = true;
    var canvasCoordinates = getCanvasCoordinates(event);
    activeIndex = core.viewport.getIndex(canvasCoordinates);
    var vpDetail = core.viewport.viewportDetails[activeIndex];
    var canvasCoordinates = getCanvasCoordinates(event);
    viewportCoordinates = vpDetail.convertCanvasToViewport(canvasCoordinates);
    var solarCoordinates4D = vpDetail.convertViewportToView(viewportCoordinates);
    lastSolarCoordinates4D = solarCoordinates4D.dup();

    solarCoordinates4D = getMatrix().x(solarCoordinates4D);

    document.getElementById("canvasCoordinates").innerHTML = "" + canvasCoordinates.elements[0] + " " + canvasCoordinates.elements[1];
    document.getElementById("viewportCoordinates").innerHTML = "" + viewportCoordinates.elements[0] + " " + viewportCoordinates.elements[1];

    document.getElementById("solarCoordinates3D").innerHTML = "" + solarCoordinates4D.elements[0] + " " + solarCoordinates4D.elements[1] + " " + solarCoordinates4D.elements[2];

    lastPhi = Math.atan2(solarCoordinates4D.elements[0], solarCoordinates4D.elements[2]);
    lastTheta = Math.PI / 2. - Math.acos(solarCoordinates4D.elements[1]);
    core.L0click = lastPhi;
    core.B0click = -lastTheta;

    document.getElementById("thetaPhi").innerHTML = "phi:" + (lastPhi + core.phi[activeIndex]) * 180. / Math.PI + " theta:" + (lastTheta + core.theta[activeIndex]) * 180. / Math.PI;
    document.getElementById("L0B0").innerHTML = "L0:" + (core.L0click) * 180. / Math.PI + " B0:" + (core.B0click) * 180. / Math.PI;

}
deltaMatrix = Matrix.I(4);
function handleMouseUp(event) {
    mouseDown = false;
    deltaMatrix = core.mouseMatrix;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    if (core.viewport.viewportDetails[activeIndex].mode === '3D') {
        handleMouseMove3D(event);
    }
}

function createRotationMatrixFromVectors(vec1, vec2) {
    var crossvec = vec1.cross(vec2);
    var dl = Math.sqrt(crossvec.dot(crossvec));
    var mm = null;
    if (!isNaN(dl) && dl !== 0) {
        if (dl > 1.) {
            dl = 1.;
        }
        if (dl < -1.) {
            dl = -1.;
        }
        var a = Math.asin(dl);
        crossvec = crossvec.toUnitVector();
        var mm = Matrix.Rotation(a, crossvec).ensure4x4();
    }
    return mm;
}

function handleMouseMove3D(event) {
    var vpDetail = core.viewport.viewportDetails[activeIndex];
    var canvasCoordinates = getCanvasCoordinates(event);
    viewportCoordinates = vpDetail.convertCanvasToViewport(canvasCoordinates);
    var solarCoordinates4D = vpDetail.convertViewportToView(viewportCoordinates);
    var solarCoordinates3D = solarCoordinates4D.dup();
    solarCoordinates3D.elements.pop();
    var lastSolarCoordinates3D = lastSolarCoordinates4D.dup();
    lastSolarCoordinates3D.elements.pop();
    mm = createRotationMatrixFromVectors(solarCoordinates3D, lastSolarCoordinates3D);
    if (mm != null) {
        core.mouseMatrix = deltaMatrix.x(mm);
    }
}

handleMouseWheel = function(event) {
    var canvasCoord = getCanvasCoordinates(event);
    var index = core.viewport.getIndex(canvasCoord);

    var wheel = event.wheelDelta / 120;// n or -n

    var zoom = 1 + wheel / 2;
    core.viewport.viewportDetails[index].zoom = core.viewport.viewportDetails[index].zoom * zoom;
    if (core.viewport.viewportDetails[index] < 0.1) {
        core.viewport.viewportDetails[index] = 0.1;
    }
    if (core.viewport.viewportDetails[index] > 5.0) {
        core.viewport.viewportDetails[index] = 5.0;
    }
    core.viewport.computeProjectionMatrix(index);
    event.preventDefault();
}