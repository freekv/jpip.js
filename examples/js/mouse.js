var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = (newX - lastMouseX) / 500.;
    var deltaY = -(newY - lastMouseY) / 500.;

    core.mouseMatrix = core.mouseMatrix.multiply(Matrix.Translation($V([ deltaX, deltaY, 0 ])).ensure4x4());

    lastMouseX = newX
    lastMouseY = newY;
}

handleMouseWheel = function(event) {
    var newX;
    var newY;
    if (event.pageX || event.pageY) {
        newX = event.pageX;
        newY = event.pageY;
    } else {
        newX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        newY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    newX -= core.canvas.offsetLeft;
    newY -= core.canvas.offsetTop;
    newY = core.viewport.totalHeight - newY;

    var vcl = core.viewport.totalWidth / core.viewport.columns;
    var vrl = core.viewport.totalHeight / core.viewport.rows;
    var index;
    var quit = false;

    for (var ll = 0; !quit && ll < core.viewport.columns; ll++) {
        for (var rr = 0; !quit && rr < core.viewport.rows; rr++) {
            console.log(newX + " " + ll * vcl + " " + ll * vcl + vcl);
            console.log(newY + " " + rr * vrl + " " + rr * vrl + vrl);

            if (newX >= ll * vcl && newX <= ll * vcl + vcl && newY >= rr * vrl && newY <= rr * vrl + vrl) {
                quit = true;
                index = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
                console.log("INDEX " + index);
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
    event.preventDefault();

}