var mouseDown = false;
var lastMouse = null;

var activeIndex = 0;
getCanvasCoordinates = function(event) {
    var coordinates = {};
    var rect = core.canvas.getBoundingClientRect();
    coordinates.x = event.clientX - rect.left;
    coordinates.y = event.clientY - rect.top;
    return coordinates;
}
function handleMouseDown(event) {
    mouseDown = true;
    var canvasCoordinates = getCanvasCoordinates(event);

    var perspectiveMatrix = makePerspective(90 * core.zoom[0], 1024.0 / 1024.0, 0.1, 100.0);
    perspectiveMatrix = perspectiveMatrix.multiply(Matrix.Translation($V([ 0., 0., -1. ])));
    perspectiveMatrix = perspectiveMatrix.inverse();
    var solarCoordinates = perspectiveMatrix.multiply($V([ 2. * (canvasCoordinates.x / core.viewport.totalWidth - 0.5), 2. * (canvasCoordinates.y / core.viewport.totalWidth - 0.5), 0., 0. ]));
    document.getElementById("canvasCoordinates").innerHTML = "" + canvasCoordinates.x + " " + canvasCoordinates.x;
    document.getElementById("solarCoordinates").innerHTML = "" + solarCoordinates.elements[0] + " " + solarCoordinates.elements[1] + " " + solarCoordinates.elements[2];

    lastMouse = solarCoordinates;

    var vcl = core.viewport.totalWidth / core.viewport.columns;
    var vrl = core.viewport.totalHeight / core.viewport.rows;
    var quit = false;

    for (var ll = 0; !quit && ll < core.viewport.columns; ll++) {
        for (var rr = 0; !quit && rr < core.viewport.rows; rr++) {
            if (canvasCoordinates.x >= ll * vcl && canvasCoordinates.x <= ll * vcl + vcl && canvasCoordinates.y >= rr * vrl && canvasCoordinates.y <= rr * vrl + vrl) {
                quit = true;
                activeIndex = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
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
    var canvasCoordinates = getCanvasCoordinates(event);
    var perspectiveMatrix = makePerspective(90 * core.zoom[activeIndex], 1024.0 / 1024.0, 0.1, 100.0);
    perspectiveMatrix = perspectiveMatrix.multiply(Matrix.Translation($V([ 0., 0., -1. ])));
    perspectiveMatrix = perspectiveMatrix.inverse();
    var solarCoordinates = perspectiveMatrix.multiply($V([ 2. * (canvasCoordinates.x / core.viewport.totalWidth - 0.5), 2. * (canvasCoordinates.y / core.viewport.totalWidth - 0.5), 0., 0. ]));

    var deltaX = solarCoordinates.elements[0] - lastMouse.elements[0];// /
    // core.viewport.totalWidth;
    var deltaY = -(solarCoordinates.elements[1] - lastMouse.elements[1]);// /
    // core.viewport.totalWidth;
    // var matr = makePerspective(90 * core.zoom[index], 1024.0 / 1024.0, 0.1,
    // 100.0);
    // var matrinv = inverse(matr);
    // matrinv.multiply()
    core.mouseMatrix[activeIndex] = core.mouseMatrix[activeIndex].multiply(Matrix.Translation($V([ deltaX, deltaY, 0 ])).ensure4x4());

    lastMouse = solarCoordinates;
}

handleMouseWheel = function(event) {

    var target = event.target || event.srcElement;
    var rect = target.getBoundingClientRect();
    var offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    var newX = offsetX;
    var newY = core.viewport.totalHeight - offsetY;

    var vcl = core.viewport.totalWidth / core.viewport.columns;
    var vrl = core.viewport.totalHeight / core.viewport.rows;
    var index;
    var quit = false;

    for (var ll = 0; !quit && ll < core.viewport.columns; ll++) {
        for (var rr = 0; !quit && rr < core.viewport.rows; rr++) {
            if (newX >= ll * vcl && newX <= ll * vcl + vcl && newY >= rr * vrl && newY <= rr * vrl + vrl) {
                quit = true;
                index = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
            }
        }
    }

    var wheel = event.wheelDelta / 120;// n or -n

    var zoom = 1 + wheel / 2;
    core.zoom[index] = core.zoom[index] * zoom;
    if (core.zoom[index] < 0.1) {
        core.zoom[index] = 0.1;
    }
    if (core.zoom[index] > 1.8) {
        core.zoom[index] = 1.8;
    }
    core.computeProjectionMatrix(index);
    event.preventDefault();
}