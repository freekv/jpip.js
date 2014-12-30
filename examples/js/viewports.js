viewport = function() {
    this.gui
    this.totalWidth = 512;
    this.totalHeight = 512;
    this.rows = 1;
    this.columns = 1;
    this.listeners = [];
    this.modeList = [ '2D', '3D', 'limb', 'limbexponential' ]
    this.modes = {};
};

viewport.prototype.setRows = function(rows) {
    this.rows = parseInt(rows);
}

viewport.prototype.setColumns = function(columns) {
    this.columns = parseInt(columns);
}

viewport.prototype.initGui = function() {
    this.viewportElement = document.getElementById("viewport");
    this.addRowElements();
    this.addWidthHeightControl();
}

viewport.prototype.addRowElements = function() {
    var toAdd = [ 'rowNumber', 'columnNumber' ];
    var labels = [ 'Number of rows:', 'Number of columns:' ]

    for (var i = 0; i < 2; i++) {
        var elLabel = document.createElement("label");
        elLabel.innerHTML = labels[i];
        var el = document.createElement("input");
        el.setAttribute("type", "number");
        el.setAttribute("data-type", toAdd[i]);
        el.setAttribute("min", 1);
        el.setAttribute("max", 4);
        el.setAttribute("step", 1);
        el.value = 1;
        el.addEventListener("change", this, false);
        this.viewportElement.appendChild(elLabel);
        this.viewportElement.appendChild(el);
        this.viewportElement.appendChild(document.createElement("br"));

    }
}

viewport.prototype.addWidthHeightControl = function() {
    var toAdd = [ 'width', 'height' ];
    var labels = [ 'Width:', 'Height:' ]
    for (var i = 0; i < 2; i++) {
        var elLabel = document.createElement("label");
        elLabel.innerHTML = labels[i];
        var el = document.createElement("input");
        el.setAttribute("type", "number");
        el.setAttribute("data-type", toAdd[i]);
        el.setAttribute("min", 128);
        el.setAttribute("max", 4096);
        el.setAttribute("step", 1);
        el.value = 512;
        el.addEventListener("change", this, false);
        this.viewportElement.appendChild(elLabel);
        this.viewportElement.appendChild(el);
        this.viewportElement.appendChild(document.createElement("br"));
    }
}

viewport.prototype.handleEvent = function(e) {
    switch (e.type) {
        case "change":
            var elementType = e.srcElement.attributes["data-type"].value;
            var element = e.target || e.srcElement;
            if (elementType == "rowNumber") {
                this.setRows(element.value);
                this.viewportChanged();
            } else if (elementType == "columnNumber") {
                this.setColumns(element.value);
                this.viewportChanged();
            } else if (elementType == "width") {
                this.setWidth(element.value);
            } else if (elementType == "height") {
                this.setHeight(element.value);
            }
    }
}

viewport.prototype.setHeight = function(height) {
    var canvas = document.getElementById("glcanvas");
    canvas.height = height;
    this.totalHeight = height;

}
viewport.prototype.setWidth = function(width) {
    var canvas = document.getElementById("glcanvas");
    canvas.width = width;
    this.totalWidth = width

}

viewport.prototype.addListener = function(newlistener) {
    this.listeners.push(newlistener);
}

viewport.prototype.viewportChanged = function() {
    for (var i = 0; i < this.listeners.length; i++) {
        this.listeners[i].fireViewportChanged(this);
    }
    this.updateGui();
}

viewport.prototype.updateGui = function() {
    var viewportDiv = document.getElementById("viewportDiv");
    for (var ll = 0; ll < core.viewport.columns; ll++) {
        for (var rr = 0; rr < core.viewport.rows; rr++) {
            var index = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
            if (this.modes[index] === undefined) {
                this.loadViewportModesGui(viewportDiv, index);
            }
        }
    }
    for (var index = core.viewport.columns * core.viewport.rows; index < 16; index++) {
        var el = document.getElementById("comboViewportModeDiv" + index);

        if (el !== null) {
            el.parentNode.removeChild(el);
            this.modes[index] = undefined;
        }
    }
}

viewport.prototype.loadViewportModesGui = function(viewportDiv, number) {
    var comboViewportModeDiv = document.createElement("div");
    comboViewportModeDiv.setAttribute("id", "comboViewportModeDiv" + number);
    viewportDiv.appendChild(comboViewportModeDiv);

    var comboViewportModes = document.createElement("select");
    comboViewportModes.setAttribute("class", "comboViewportModemap");
    comboViewportModes.setAttribute("multiple", "multiple");

    for (var i = 0; i < this.modeList.length; i++) {
        var comboViewportOption = document.createElement("option");
        comboViewportOption.setAttribute("value", i);
        comboViewportOption.innerHTML = this.modeList[i];
        comboViewportModes.appendChild(comboViewportOption);
        if (i === 0) {
            comboViewportOption.setAttribute("selected", true);
        }
    }
    var comboViewportLabel = document.createElement("label");
    comboViewportLabel.innerHTML = "Viewport:";
    comboViewportModeDiv.appendChild(comboViewportLabel);
    comboViewportModeDiv.appendChild(comboViewportModes);
    comboViewportModeDiv.appendChild(document.createElement("br"));
    comboViewportModes.setAttribute("data-type", "comboViewportModes");
    comboViewportModes.setAttribute("data-viewport", "" + number);
    comboViewportModes.addEventListener("change", this, false);
    this.modes[number] = this.modeList[0];
}