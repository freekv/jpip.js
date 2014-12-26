//Uses globals: objectList from webgl.js

gui = function() {
    this.datasetGUIObject = {};
    this.controlpanel = document.getElementById("controlpanel");
    this.local_controlpanel = document.getElementById("local_controlpanel");
    this.datePanel = document.getElementById("datePanel");
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
    var dateEl = document.createElement("input");
    dateEl.id = id;
    dateEl.setAttribute("type", "textarea");
    var setDate = new Date;
    setDate.setDate(setDate.getDate() - number);
    dateEl.value = formatDate(setDate);
    dateEl.addEventListener("scroll", function(e) {
        console.log("EVENT" + e);
    });
    this.datasetGUIObject[id] = dateEl;
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
        objectList.push(new solarJPIP(serverName, imageName, frameCount, 512));
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
                    core.objectList.push(new solarJPIP("http" + jpxparts[0].substring(4, jpxparts[0].length), "movies" + jpxparts[1], data.frames.length, 512));
                };
                getJSON(this.buildUrl(), success, function(e) {
                });
                this.setBeginAndEndDate();
            }
        case "change":
            var element = e.target || e.srcElement;
            var elementType = element.attributes["data-type"].value;
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

}
