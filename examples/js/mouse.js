var mouseDown = false;

var activeIndex = 0;
getCanvasCoordinates = function(event) {
    var rect = core.canvas.getBoundingClientRect();
    var coordinates = $V([ event.clientX - rect.left, event.clientY - rect.top ]);
    return coordinates;
}

function handleMouseDown(event) {
    mouseDown = true;
    var canvasCoordinates = getCanvasCoordinates(event);
    activeIndex = core.viewport.getIndex(canvasCoordinates);
    var vpDetail = core.viewport.viewportDetails[activeIndex];
    vpDetail.handleMouseDown(event);
    requestAnimationFrame(core.drawScene);
}

function handleMouseUp(event) {
    mouseDown = false;
    var vpDetail = core.viewport.viewportDetails[activeIndex];
    vpDetail.handleMouseUp(event);
    requestAnimationFrame(core.drawScene);
}

function handleMouseMove(event) {
    var vpDetail = core.viewport.viewportDetails[activeIndex];
    vpDetail.handleMouseMove(event);
    if (mouseDown) {
        requestAnimationFrame(core.drawScene);
    }
}

handleMouseWheel = function(event) {
    var canvasCoordinates = getCanvasCoordinates(event);
    var index = core.viewport.getIndex(canvasCoordinates);
    var vpDetail = core.viewport.viewportDetails[index];
    vpDetail.handleMouseWheel(event);
    requestAnimationFrame(core.drawScene);
}