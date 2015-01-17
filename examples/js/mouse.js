var mouseDown = false;
var lastMouse = null;
var lastPhi = 0.;
var lastTheta = 0.;
var activeIndex = 0;
getCanvasCoordinates = function(event) {
    var coordinates = {};
    var rect = core.canvas.getBoundingClientRect();
    coordinates.x = event.clientX - rect.left;
    coordinates.y = event.clientY - rect.top;
    return coordinates;
}
getMatrix = function() {
    var M1 = Matrix.Rotation(-core.B0, $V([ 1, 0, 0 ]));
    var M2 = Matrix.Rotation(core.L0, $V([ 0, 1, 0 ]));
    var M = M2.x(M1);
    return M.ensure4x4();
}
function handleMouseDown(event) {
    mouseDown = true;
    var canvasCoordinates = getCanvasCoordinates(event);
    var vpm = core.viewport.viewportDetails[activeIndex].projectionMatrix.inverse();

    var solarCoordinates = vpm.multiply($V([ 2. * (canvasCoordinates.x / core.viewport.totalWidth - 0.5), 2. * (canvasCoordinates.y / core.viewport.totalWidth - 0.5), 0., 0. ]));
    var solarCoordinates3Dz = Math.sqrt(1 - solarCoordinates.dot(solarCoordinates));
    var solarCoordinates3D = solarCoordinates.dup();
    solarCoordinates3D.elements[2] = solarCoordinates3Dz;
    solarCoordinates3D = getMatrix().x(solarCoordinates3D);

    document.getElementById("canvasCoordinates").innerHTML = "" + canvasCoordinates.x + " " + canvasCoordinates.x;
    document.getElementById("solarCoordinates").innerHTML = "" + solarCoordinates.elements[0] + " " + solarCoordinates.elements[1] + " " + solarCoordinates.elements[2] + " " + solarCoordinates.elements[3];
    document.getElementById("solarCoordinates3D").innerHTML = "" + solarCoordinates3D.elements[0] + " " + solarCoordinates3D.elements[1] + " " + solarCoordinates3D.elements[2];
    varsign = 1.;

    lastPhi = Math.atan2(solarCoordinates3D.elements[0], solarCoordinates3D.elements[2]);
    lastTheta = Math.PI / 2. - Math.acos(solarCoordinates3D.elements[1]);
    core.L0click = (lastPhi);// + core.L0);
    core.B0click = (lastTheta);// + core.B0);

    document.getElementById("thetaPhi").innerHTML = "phi:" + (lastPhi + core.phi[activeIndex]) * 180. / Math.PI + " theta:" + (lastTheta + core.theta[activeIndex]) * 180. / Math.PI;
    document.getElementById("L0B0").innerHTML = "L0:" + (core.L0click) * 180. / Math.PI + " B0:" + (core.B0click) * 180. / Math.PI;

    lastMouse = solarCoordinates;

    var vcl = core.viewport.totalWidth / core.viewport.columns;
    var vrl = core.viewport.totalHeight / core.viewport.rows;
    var quit = false;

    for (var ll = 0; !quit && ll < core.viewport.columns; ll++) {
        for (var rr = 0; !quit && rr < core.viewport.rows; rr++) {
            if (canvasCoordinates.x >= ll * vcl && canvasCoordinates.x <= ll * vcl + vcl && canvasCoordinates.y >= rr * vrl && canvasCoordinates.y <= rr * vrl + vrl) {
                quit = true;
                activeIndex = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
                console.log(activeIndex);
            }
        }
    }
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    if (core.viewport.modes[activeIndex] === '3D') {
        handleMouseMove3D(event);
    }
}

function handleMouseMove3D(event) {
    var canvasCoordinates = getCanvasCoordinates(event);
    var vpm = core.viewport.viewportDetails[activeIndex].projectionMatrix.inverse();

    var solarCoordinates = vpm.multiply($V([ 2. * (canvasCoordinates.x / core.viewport.totalWidth - 0.5), 2. * (canvasCoordinates.y / core.viewport.totalWidth - 0.5), 0., 0. ]));
    var solarCoordinates3Dz = Math.sqrt(1 - solarCoordinates.dot(solarCoordinates));

    var solarCoordinates3D = solarCoordinates.dup();
    solarCoordinates3D.elements[2] = solarCoordinates3Dz;

    var deltaX = solarCoordinates.elements[0] - lastMouse.elements[0];
    var deltaY = -(solarCoordinates.elements[1] - lastMouse.elements[1]);
    phi = Math.atan(solarCoordinates3D.elements[0] / solarCoordinates3D.elements[2]);
    theta = Math.acos(solarCoordinates3D.elements[1]) - Math.PI / 2.;
    M1 = Matrix.Rotation((lastTheta - theta), $V([ 1, 0, 0 ]));
    M2 = Matrix.Rotation(-(lastPhi - phi), $V([ 0, 1, 0 ]));
    M = M2.x(M1);
    if (!(isNaN(phi) || isNaN(lastPhi) || isNaN(theta) || isNaN(lastTheta))) {
        core.theta[activeIndex] += (lastTheta - theta);
        core.phi[activeIndex] += (lastPhi - phi);
    }

    lastPhi = phi;
    lastTheta = theta;
}

handleMouseWheel = function(event) {
    var canvasCoord = getCanvasCoordinates(event);
    var index = core.viewport.getIndex(canvasCoord.x, canvasCoord.y);

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