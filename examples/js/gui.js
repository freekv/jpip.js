gui = function() {
};
gui.prototype.datasetGUIObject = {};
gui.prototype.reinsertCombo = function(name, controlpanel, nextel) {
    gui.prototype.datasetGUIObject[name] = undefined;
    var comboDataList = document.getElementById(name + "ComboDataList");
    comboDataList.parentElement.removeChild(comboDataList);
    gui.prototype.createCombobox(controlpanel, name, nextel);
}
gui.prototype.datasetSelected = function(e) {
    var controlpanel = document.getElementById("controlpanel");

    var comboDataList = e.srcElement;
    var selectedIndex = comboDataList.selectedIndex;
    var selectedText = comboDataList.children[selectedIndex].childNodes[0].data;
    if (comboDataList.id == "observatoryComboDataList") {
        gui.prototype.datasetGUIObject.observatory = selectedText;

        var nextel = gui.prototype.datasetGUIObject.data[gui.prototype.datasetGUIObject.observatory].children;
        gui.prototype.reinsertCombo("instrument", controlpanel, nextel);

        nextel = nextel[gui.prototype.datasetGUIObject.instrument].children;
        gui.prototype.reinsertCombo("detector", controlpanel, nextel);

        nextel = nextel[gui.prototype.datasetGUIObject.instrument].children;
        gui.prototype.reinsertCombo("measurement", controlpanel, nextel);

    } else if (comboDataList.id == "instrumentComboDataList") {
        gui.prototype.datasetGUIObject.instrument = selectedText;
        gui.prototype.datasetGUIObject.detector = undefined;

        var nextel = gui.prototype.datasetGUIObject.data[gui.prototype.datasetGUIObject.observatory].children;
        nextel = nextel[gui.prototype.datasetGUIObject.instrument].children;
        gui.prototype.reinsertCombo("detector", controlpanel, nextel);

        nextel = nextel[gui.prototype.datasetGUIObject.instrument].children;
        gui.prototype.reinsertCombo("measurement", controlpanel, nextel);

    } else if (comboDataList.id == "detectorComboDataList") {
        gui.prototype.datasetGUIObject.detector = selectedText;
        var nextel = gui.prototype.datasetGUIObject.data[gui.prototype.datasetGUIObject.observatory].children;
        nextel = nextel[gui.prototype.datasetGUIObject.instrument].children;
        nextel = nextel[gui.prototype.datasetGUIObject.measurement].children;
        gui.prototype.reinsertCombo("measurement", controlpanel, nextel);

    } else if (comboDataList.id == "measurementComboDataList") {
        gui.prototype.datasetGUIObject.detector = selectedText;
    }
}

gui.prototype.createCombobox = function(controlpanel, name, data) {
    var comboDataList = document.createElement("select");
    comboDataList.setAttribute("id", name + "ComboDataList");
    var index = 0;
    var foundindex = -1;
    for ( var key in data) {
        if (gui.prototype.datasetGUIObject[name] === undefined) {
            gui.prototype.datasetGUIObject[name] = key;
        }
        var comboDataListOption = document.createElement("option");
        comboDataListOption.setAttribute("value", index);
        comboDataListOption.innerHTML = key;
        comboDataList.appendChild(comboDataListOption);
        if (gui.prototype.datasetGUIObject[name] == key) {
            foundindex = index;
        }
        index++;
    }
    comboDataList.onchange = gui.prototype.datasetSelected;
    gui.prototype.datasetGUIObject[name + "HtmlElement"] = comboDataList;
    comboDataList.selectIndex = foundindex;
    comboDataList.value = foundindex;
    controlpanel.appendChild(comboDataList);
}
gui.prototype.createDatebox = function(controlpanel, id, number) {
    var dateEl = document.createElement("input");
    dateEl.id = id;
    dateEl.setAttribute("type", "textarea");
    var setDate = new Date;
    setDate.setDate(setDate.getDate() - number);
    dateEl.value = formatDate(setDate);
    dateEl.addEventListener("scroll", function(e) {
        console.log("EVENT" + e);
    });
    gui.prototype.datasetGUIObject[id] = dateEl;
    controlpanel.appendChild(dateEl);
}

gui.prototype.buildUrl = function() {
    var url = gui.prototype.datasetGUIObject.baseurl;
    url += "&observatory=";
    var obs = gui.prototype.datasetGUIObject["observatoryHtmlElement"];
    url += obs.children[obs.selectedIndex].childNodes[0].data;
    url += "&instrument=";
    var obs = gui.prototype.datasetGUIObject["instrumentHtmlElement"];
    url += obs.children[obs.selectedIndex].childNodes[0].data;
    url += "&detector=";
    var det = gui.prototype.datasetGUIObject["detectorHtmlElement"]
    url += det.children[det.selectedIndex].childNodes[0].data;
    url += "&measurement=";
    var meas = gui.prototype.datasetGUIObject["measurementHtmlElement"]
    url += meas.children[meas.selectedIndex].childNodes[0].data;
    url += "&startTime=";
    url += gui.prototype.datasetGUIObject["startTime"].value + "Z";
    url += "&endTime=";
    url += gui.prototype.datasetGUIObject["endTime"].value + "Z";
    url += "&cadence=1800&jpip=true&verbose=true&linked=true";
    return url;
}

gui.prototype.initGui = function(data) {
    gui.prototype.datasetGUIObject.data = data;
    gui.prototype.datasetGUIObject.baseurl = "http://swhv.oma.be/hv/api/index.php?action=getJPX";
    var local_controlpanel = document.getElementById("local_controlpanel");

    var serverLabel = document.createElement("label");
    serverLabel.setAttribute("for", "serverExternal");
    serverLabel.innerHTML = "Server: ";
    local_controlpanel.appendChild(serverLabel);

    var serverInput = document.createElement("input");
    serverInput.id = "serverExternal";
    serverInput.setAttribute("type", "text");
    serverInput.setAttribute("size", "40");
    serverInput.setAttribute("value", "http://127.0.0.1:8090/");
    local_controlpanel.appendChild(serverInput);
    local_controlpanel.appendChild(document.createElement("br"));

    var imageInputLabel = document.createElement("label");
    imageInputLabel.setAttribute("for", "imageExternal");
    imageInputLabel.innerHTML = "JPX: ";
    local_controlpanel.appendChild(imageInputLabel);
    var imageInput = document.createElement("input");
    imageInput.id = "imageExternal";
    imageInput.setAttribute("type", "text");
    imageInput.setAttribute("size", "120");
    imageInput.setAttribute("value", "SWAP.jpx");
    local_controlpanel.appendChild(imageInput);
    local_controlpanel.appendChild(document.createElement("br"));

    var numberOfFramesLabel = document.createElement("label");
    numberOfFramesLabel.setAttribute("for", "imageExternal");
    numberOfFramesLabel.innerHTML = "Max number of frames: ";
    local_controlpanel.appendChild(numberOfFramesLabel);
    var numberOfFramesInput = document.createElement("input");
    numberOfFramesInput.id = "numberOfFrames";
    numberOfFramesInput.setAttribute("type", "text");
    numberOfFramesInput.setAttribute("value", "48");
    local_controlpanel.appendChild(numberOfFramesInput);
    local_controlpanel.appendChild(document.createElement("br"));

    var externalbutton = document.createElement("button");
    externalbutton.innerHTML = "Load external";
    local_controlpanel.appendChild(externalbutton);
    externalbutton.onclick = function() {
        var serverName = document.getElementById("serverExternal").value;
        var imageName = document.getElementById("imageExternal").value;
        var numberOfFrames = document.getElementById("imageExternal").value;
        var frameCount = parseInt(numberOfFramesInput.value);
        objectList.push(new solarJPIP(serverName, imageName, frameCount, 512));
    }

    var controlpanel = document.getElementById("controlpanel");

    var button = document.createElement("button");
    button.innerHTML = "Load";
    controlpanel.appendChild(button);
    button.onclick = function() {
        var success = function(data) {
            var jpxfile = data.uri;
            var jpxparts = jpxfile.split("movies");
            objectList.push(new solarJPIP("http" + jpxparts[0].substring(4, jpxparts[0].length), "movies" + jpxparts[1], data.frames.length, 512));
            // objectList.push(new solarJPIP("http://localhost:8090/", "movies"
            // + jpxparts[1], data.frames.length, 512));
        };
        console.log(gui.prototype.buildUrl());
        getJSON(gui.prototype.buildUrl(), success, function(e) {
            console.log();
        });
    }
    controlpanel.appendChild(document.createElement("br"));

    var dateNumber = 1;
    gui.prototype.createDatebox(controlpanel, "startTime", dateNumber);
    controlpanel.appendChild(document.createElement("br"));
    dateNumber--;
    gui.prototype.createDatebox(controlpanel, "endTime", dateNumber);
    controlpanel.appendChild(document.createElement("br"));
    var nextel = gui.prototype.datasetGUIObject.data;
    gui.prototype.datasetGUIObject["observatory"] = "SDO";
    gui.prototype.createCombobox(controlpanel, "observatory", nextel);
    nextel = nextel[gui.prototype.datasetGUIObject.observatory].children;
    gui.prototype.createCombobox(controlpanel, "instrument", gui.prototype.datasetGUIObject.data[gui.prototype.datasetGUIObject.observatory].children);
    nextel = nextel[gui.prototype.datasetGUIObject.instrument].children;
    gui.prototype.createCombobox(controlpanel, "detector", nextel);
    nextel = nextel[gui.prototype.datasetGUIObject.detector].children;
    gui.prototype.createCombobox(controlpanel, "measurement", nextel);

};

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
}

document.addEventListener("DOMContentLoaded", function(event) {
    base_url = "http://swhv.oma.be/hv/";
    var success = function(data) {
        vgui = new gui();
        vgui.initGui(data);
    };
    getJSON(base_url + "api/?action=getDataSources&verbose=true&enable=[STEREO_A,STEREO_B,PROBA2]", success, success);
});
