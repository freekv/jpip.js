//Uses globals: objectList from webgl.js

gui = function() {
    this.datasetGUIObject = {};
    this.types = {};
    this.controlpanel = document.getElementById("controlpanel");
    this.local_controlpanel = document.getElementById("local_controlpanel");
    this.datePanel = document.getElementById("datePanel");
    this.layersPanel = document.getElementById("layers");
    this.addTypePanel("solarJPIP");
};

gui.prototype.reinsertCombo = function(name, nextel) {
    this.datasetGUIObject[name] = undefined;
    var comboDataList = document.getElementById(name + "ComboDataList");
    comboDataList.parentElement.removeChild(comboDataList);
    this.createCombobox(name, nextel);
}
gui.prototype.datasetSelected = function(e) {
    var comboDataList = e.target || e.srcElement;
    var selectedIndex = comboDataList.selectedIndex;
    var selectedText = comboDataList.children[selectedIndex].childNodes[0].data;
    if (comboDataList.id == "observatoryComboDataList") {
        this.datasetGUIObject.observatory = selectedText;

        var nextel = this.datasetGUIObject.data[this.datasetGUIObject.observatory].children;
        this.reinsertCombo("instrument", nextel);

        nextel = nextel[this.datasetGUIObject.instrument].children;
        this.reinsertCombo("detector", nextel);

        nextel = nextel[this.datasetGUIObject.instrument].children;
        this.reinsertCombo("measurement", nextel);

    } else if (comboDataList.id == "instrumentComboDataList") {
        this.datasetGUIObject.instrument = selectedText;
        this.datasetGUIObject.detector = undefined;

        var nextel = this.datasetGUIObject.data[this.datasetGUIObject.observatory].children;
        nextel = nextel[this.datasetGUIObject.instrument].children;
        this.reinsertCombo("detector", nextel);

        nextel = nextel[this.datasetGUIObject.instrument].children;
        this.reinsertCombo("measurement", nextel);

    } else if (comboDataList.id == "detectorComboDataList") {
        this.datasetGUIObject.detector = selectedText;
        var nextel = this.datasetGUIObject.data[this.datasetGUIObject.observatory].children;
        nextel = nextel[this.datasetGUIObject.instrument].children;
        nextel = nextel[this.datasetGUIObject.measurement].children;
        this.reinsertCombo("measurement", nextel);

    } else if (comboDataList.id == "measurementComboDataList") {
        this.datasetGUIObject.detector = selectedText;
    }
}

gui.prototype.createCombobox = function(name, data) {
    var comboDataList = document.createElement("select");
    comboDataList.setAttribute("id", name + "ComboDataList");
    var index = 0;
    var foundindex = -1;
    for ( var key in data) {
        if (this.datasetGUIObject[name] === undefined) {
            this.datasetGUIObject[name] = key;
        }
        var comboDataListOption = document.createElement("option");
        comboDataListOption.setAttribute("value", index);
        comboDataListOption.innerHTML = key;
        comboDataList.appendChild(comboDataListOption);
        if (this.datasetGUIObject[name] == key) {
            foundindex = index;
        }
        index++;
    }

    comboDataList.addEventListener("change", this, false);
    this.datasetGUIObject[name + "HtmlElement"] = comboDataList;
    comboDataList.selectIndex = foundindex;
    comboDataList.value = foundindex;
    this.controlpanel.appendChild(comboDataList);
}
gui.prototype.createDatebox = function(id, number) {
    var dateElLabel = document.createElement("label");
    dateElLabel.setAttribute("for", id);
    if (number == 0) {
        dateElLabel.innerHTML = "End date: ";
    } else {
        dateElLabel.innerHTML = "Start date: ";
    }

    var dateEl = document.createElement("input");
    dateEl.id = id;
    dateEl.setAttribute("type", "textarea");
    var setDate = new Date();
    setDate.setDate(setDate.getDate() - number - 10);
    dateEl.value = formatDate(setDate);
    dateEl.addEventListener("scroll", function(e) {
        console.log("EVENT" + e);
    });
    this.datasetGUIObject[id] = dateEl;
    dateElLabel.setAttribute("class", "alignlabel");
    dateEl.setAttribute("class", "aligninput");

    this.datePanel.appendChild(dateElLabel);
    this.datePanel.appendChild(dateEl);
}

gui.prototype.buildUrl = function() {
    var url = this.datasetGUIObject.baseurl;
    url += "&observatory=";
    var obs = this.datasetGUIObject["observatoryHtmlElement"];
    url += obs.children[obs.selectedIndex].childNodes[0].data;
    url += "&instrument=";
    var obs = this.datasetGUIObject["instrumentHtmlElement"];
    url += obs.children[obs.selectedIndex].childNodes[0].data;
    url += "&detector=";
    var det = this.datasetGUIObject["detectorHtmlElement"]
    url += det.children[det.selectedIndex].childNodes[0].data;
    url += "&measurement=";
    var meas = this.datasetGUIObject["measurementHtmlElement"]
    url += meas.children[meas.selectedIndex].childNodes[0].data;
    url += "&startTime=";
    url += this.datasetGUIObject["startTime"].value + "Z";
    url += "&endTime=";
    url += this.datasetGUIObject["endTime"].value + "Z";
    url += "&cadence=1800&jpip=true&verbose=true&linked=true";
    return url;
}

gui.prototype.setBeginAndEndDate = function() {
    core.beginDate = parseDate(this.datasetGUIObject["startTime"].value, 0);
    core.endDate = parseDate(this.datasetGUIObject["endTime"].value, 0);
    core.currentDate = core.beginDate;
}

gui.prototype.createServerPanel = function(data) {
    this.datasetGUIObject.data = data;
    this.datasetGUIObject.baseurl = "http://swhv.oma.be/hv/api/index.php?action=getJPX";

    var serverLabel = document.createElement("label");
    serverLabel.setAttribute("for", "serverExternal");
    serverLabel.innerHTML = "Server: ";
    local_controlpanel.appendChild(serverLabel);

    var serverInput = document.createElement("input");
    serverInput.id = "serverExternal";
    serverInput.setAttribute("type", "text");
    serverInput.setAttribute("size", "40");
    serverInput.setAttribute("value", "http://127.0.0.1:8090/");
    this.local_controlpanel.appendChild(serverInput);
    this.local_controlpanel.appendChild(document.createElement("br"));

    var imageInputLabel = document.createElement("label");
    imageInputLabel.setAttribute("for", "imageExternal");
    imageInputLabel.innerHTML = "JPX: ";
    this.local_controlpanel.appendChild(imageInputLabel);
    var imageInput = document.createElement("input");
    imageInput.id = "imageExternal";
    imageInput.setAttribute("type", "text");
    imageInput.setAttribute("size", "120");
    imageInput.setAttribute("value", "SWAP.jpx");
    this.local_controlpanel.appendChild(imageInput);
    this.local_controlpanel.appendChild(document.createElement("br"));

    var numberOfFramesLabel = document.createElement("label");
    numberOfFramesLabel.setAttribute("for", "imageExternal");
    numberOfFramesLabel.innerHTML = "Max number of frames: ";
    this.local_controlpanel.appendChild(numberOfFramesLabel);
    var numberOfFramesInput = document.createElement("input");
    numberOfFramesInput.id = "numberOfFrames";
    numberOfFramesInput.setAttribute("type", "text");
    numberOfFramesInput.setAttribute("value", "48");
    this.local_controlpanel.appendChild(numberOfFramesInput);
    this.local_controlpanel.appendChild(document.createElement("br"));

    var externalbutton = document.createElement("button");
    externalbutton.innerHTML = "Load external";
    this.local_controlpanel.appendChild(externalbutton);
    externalbutton.onclick = function() {
        var serverName = document.getElementById("serverExternal").value;
        var imageName = document.getElementById("imageExternal").value;
        var numberOfFrames = document.getElementById("imageExternal").value;
        var frameCount = parseInt(numberOfFramesInput.value);
        objectList.push(new solarJPIP(serverName, imageName, frameCount, 2048));
    }

    var loadButton = document.createElement("button");
    loadButton.innerHTML = "Load";
    this.controlpanel.appendChild(loadButton);
    loadButton.addEventListener("click", this, false);
    loadButton.setAttribute("data-type", "loadButton");

    this.controlpanel.appendChild(document.createElement("br"));
    var nextel = this.datasetGUIObject.data;
    this.datasetGUIObject["observatory"] = "SDO";
    this.createCombobox("observatory", nextel);
    nextel = nextel[this.datasetGUIObject.observatory].children;
    this.createCombobox("instrument", this.datasetGUIObject.data[this.datasetGUIObject.observatory].children);
    nextel = nextel[this.datasetGUIObject.instrument].children;
    this.createCombobox("detector", nextel);
    nextel = nextel[this.datasetGUIObject.detector].children;
    this.createCombobox("measurement", nextel);
}

gui.prototype.createDatePanel = function() {
    var dateNumber = 1;
    var extendBackwardsButton = document.createElement("button");
    extendBackwardsButton.innerHTML = "Extend Backward";
    extendBackwardsButton.setAttribute("data-type", "extendBackwardsButton");

    this.datePanel.appendChild(extendBackwardsButton);
    extendBackwardsButton.addEventListener("click", this, false);
    this.datePanel.appendChild(document.createElement("br"));

    this.createDatebox("startTime", dateNumber);
    this.datePanel.appendChild(document.createElement("br"));
    dateNumber--;
    this.createDatebox("endTime", dateNumber);
    this.datePanel.appendChild(document.createElement("br"));
}

gui.prototype.initGui = function(data) {
    this.createServerPanel(data);
    this.createDatePanel();
    this.createVideoBar();
    // this.createResizeCanvas();
};

gui.prototype.handleEvent = function(e) {
    switch (e.type) {
        case "click":
            var element = e.target || e.srcElement;
            var elementType = element.attributes["data-type"].value;
            if (elementType == "loadButton") {
                var success = function(data) {
                    var jpxfile = data.uri;
                    var jpxparts = jpxfile.split("movies");
                    var obs = core.gui.datasetGUIObject["observatoryHtmlElement"];
                    var observatory = obs.children[obs.selectedIndex].childNodes[0].data;
                    var ins = core.gui.datasetGUIObject["instrumentHtmlElement"];
                    var instrument = ins.children[ins.selectedIndex].childNodes[0].data;
                    var det = core.gui.datasetGUIObject["detectorHtmlElement"];
                    var detector = det.children[det.selectedIndex].childNodes[0].data;
                    var meas = core.gui.datasetGUIObject["measurementHtmlElement"];
                    var measurement = meas.children[meas.selectedIndex].childNodes[0].data;
                    core.objectList.push(new solarJPIP("http" + jpxparts[0].substring(4, jpxparts[0].length), "movies" + jpxparts[1], data.frames.length, 256, observatory, instrument, detector, measurement, core.beginDate, core.endDate));
                };
                getJSON(this.buildUrl(), success, function(e) {
                });
                this.setBeginAndEndDate();
            } else if (elementType == "extendBackwardsButton") {
                for (var i = 0; i < core.objectList.length; i++) {
                    core.objectList[i].extendBackwards();
                }
                this.datasetGUIObject["startTime"].value = formatDate(new Date(core.beginDate - (core.endDate - core.beginDate)));
            }
        case "change":
            var element = e.target || e.srcElement;
            if (element.id.indexOf("ComboDataList") > -1) {
                this.datasetSelected(e);
            }
    }
}
gui.prototype.createVideoBar = function() {
    var videoButton = document.getElementById("videoPlayButton");
    videoButton.addEventListener("click", function() {
        core.running = !core.running;
        var el = this.childNodes[0];
        if (core.running) {
            el.src = "images/pause.png";
        } else {
            el.src = "images/play.png";
        }
    });
    var videoNextButton = document.getElementById("videoNext");
    videoNextButton.addEventListener("click", function() {
        core.stepForward = true;
    });
    var videoPreviousButton = document.getElementById("videoPrevious");
    videoPreviousButton.addEventListener("click", function() {
        core.stepBackward = true;
    });
    var videoStartButton = document.getElementById("videoStart");
    videoStartButton.addEventListener("click", function() {
        core.currentDate = core.beginDate
    });
    var videoEndButton = document.getElementById("videoEnd");
    videoEndButton.addEventListener("click", function() {
        core.currentDate = core.endDate;
    });
}

gui.prototype.createResizeCanvas = function() {
    var canvaswrap = document.getElementById("glcanvaswrap");
    callback = function() {
        core.canvas.setAttribute("width", canvaswrap.clientWidth - 10);
        core.canvas.setAttribute("height", canvaswrap.style.height);

    };
    canvaswrap.addEventListener("mouseup", callback);
}

gui.prototype.addTypePanel = function(typeName) {
    var li = document.createElement("li")
    li.innerHTML = typeName;
    var ul = document.createElement("ul")
    li.appendChild(ul);
    this.layersPanel.appendChild(li);
    this.types[typeName] = ul;
}

gui.prototype.addLayer = function(typeName, layerName, optionsPanel) {
    var li = document.createElement("li")
    li.innerHTML = layerName;
    this.types[typeName].appendChild(li);
    var imagePanel = document.getElementById("imagepanel");
    imagePanel.appendChild(optionsPanel);
    li.onclick = function() {
        var clss = document.getElementsByClassName("activeOptionsPanel");
        for (var i = 0; i < clss.length; i++) {
            var cl = clss[i];
            cl.setAttribute("class", "inactiveOptionsPanel");
        }
        optionsPanel.setAttribute("class", "activeOptionsPanel");

        var clss = document.getElementsByClassName("activeLayer");
        for (var i = 0; i < clss.length; i++) {
            var cl = clss[i];
            cl.setAttribute("class", "inactiveLayer");
        }
        this.setAttribute("class", "activeLayer");
    };
    li.onclick();
}
