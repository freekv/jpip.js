function solarJPIP(baseurl, imgname, numberOfFrames, size) {
    this.metadataInitialized = false;
    this.initialized = false;
    this.visible = true;
    this.baseurl = baseurl;
    this.imgname = imgname;
    this.texturesAndMetadata = []
    this.parsedMetadata = [];
    this.plottingMetadata = [];
    this.textureData = [];

    this.verticesBuffer;
    this.verticesTextureCoordBuffer;
    this.verticesIndexBuffer;
    this.shaderProgram;
    this.vertexPositionAttribute;
    this.textureCoordAttribute;
    this.currentIndex = 0;
    this.numberOfFrames = numberOfFrames;
    this.size = size;
    this.colormapTexture;
    this.colormapImage;
    this.colormapInitialized = false;
    this.colorTableValue = 1.;
    this.boostboxValue = 0.8;
    this.isDiff = 0;
    this.alphaValue = 1.;
}

solarJPIP.prototype.render = function(perspectiveMatrix, mvMatrix, time) {
    if (this.parsedMetadata.length > 0) {
        this.currentIndex = this.binarySearch(time);
    }
    console.log(this.currentIndex);

    if (this.texturesAndMetadata[this.currentIndex] === undefined) {
        this.currentIndex = 0;
    }
    if (this.initialized && this.visible && this.texturesAndMetadata[this.currentIndex] !== undefined) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesTextureCoordBuffer);
        gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texturesAndMetadata[this.currentIndex].texture);

        if (this.isDiff && this.texturesAndMetadata[this.currentIndex + 1] !== undefined) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.texturesAndMetadata[this.currentIndex + 1].texture);
            gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "centerDiff"), this.texturesAndMetadata[this.currentIndex + 1].plottingMetadata.x0, this.texturesAndMetadata[this.currentIndex + 1].plottingMetadata.y0);
            gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "stretchDiff"), this.texturesAndMetadata[this.currentIndex + 1].plottingMetadata.solarRadiiX, this.texturesAndMetadata[this.currentIndex + 1].plottingMetadata.solarRadiiY);
        }
        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "isDiff"), this.isDiff);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.colormapTexture);

        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uSampler"), 0);
        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uSamplerDiff"), 1);

        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uColormap"), 2);
        gl.uniform1f(gl.getUniformLocation(this.shaderProgram, "colorTableValue"), this.colorTableValue);
        gl.uniform1f(gl.getUniformLocation(this.shaderProgram, "boostboxValue"), 1. - this.boostboxValue);
        gl.uniform1f(gl.getUniformLocation(this.shaderProgram, "alphaValue"), this.alphaValue);

        gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "center"), this.texturesAndMetadata[this.currentIndex].plottingMetadata.x0, this.texturesAndMetadata[this.currentIndex].plottingMetadata.y0);
        gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "stretch"), this.texturesAndMetadata[this.currentIndex].plottingMetadata.solarRadiiX, this.texturesAndMetadata[this.currentIndex].plottingMetadata.solarRadiiY);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);
        var pUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

        var mvUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }
}
solarJPIP.prototype.prerender = function(gl) {
    this.loadNewTextures(gl);
}
solarJPIP.prototype.updateGUI = function() {
    if (this.texturesAndMetadata[this.currentIndex] !== undefined) {
        document.getElementById("metadata").innerHTML = this.texturesAndMetadata[this.currentIndex].parsedMetadata;
    }
}
solarJPIP.prototype.init = function(gl) {
    if (!this.colormapInitialized) {
        var image = new Image();
        var ref = this;
        image.onload = function() {
            ref.colormapImage = image;
            ref.colormapInitialized = true;
        }
        image.src = "./images/gradient_jhv.png";
    }
    if (!this.initialized && this.colormapInitialized) {
        this.loadColormapTexture(gl);
        this.loadColormapGui();
        this.loadDifferenceCheckbox();
        this.loadAlphaValue();
        this.initShaders(gl);
        this.initBuffers(gl);
        this.initTextures(gl);
        this.initialized = true;
    }
}

solarJPIP.prototype.handleEvent = function(e) {
    switch (e.type) {
        case "change":
            var elementType = e.srcElement.attributes["data-type"].value;
            if (elementType == "comboColormap") {
                this.colormapSelected(e);
            } else if (elementType == "checkboxDifference") {
                if (e.srcElement.checked) {
                    this.isDiff = 1;
                } else {
                    this.isDiff = 0;
                }
            } else if (elementType == "boostboxDifference") {
                this.boostboxValue = e.srcElement.value;
            } else if (elementType == "alphabox") {
                this.alphaValue = e.srcElement.value;
            }
    }
}

solarJPIP.prototype.colormapSelected = function(e) {
    var controlpanel = document.getElementById("comboColormap");
    var comboColormap = e.srcElement;
    var selectedIndex = comboColormap.selectedIndex;
    this.colorTableValue = comboColormap.children[selectedIndex].value;
}

solarJPIP.prototype.loadColormapGui = function() {
    var colorTableNames = [ 'Blue/Green/Red/Yellow', 'Blue/Red', 'Blue/White Linear', 'Gray', 'Green/White Exponential', 'Green/White Linear', 'Rainbow 1', 'Rainbow 2', 'Red Temperature', 'SDO-AIA 131', 'SDO-AIA 1600', 'SDO-AIA 1700', 'SDO-AIA 171', 'SDO-AIA 193', 'SDO-AIA 211', 'SDO-AIA 304', 'SDO-AIA 335', 'SDO-AIA 4500', 'SDO-AIA 94', 'SOHO EIT 171', 'SOHO EIT 195', 'SOHO EIT 284', 'SOHO EIT 304', 'STEREO EUVI 171', 'STEREO EUVI 195', 'STEREO EUVI 284', 'STEREO EUVI 304' ];
    var comboColormap = document.createElement("select");
    comboColormap.setAttribute("id", "comboColormap");
    for (var i = 0; i < colorTableNames.length; i++) {
        var comboColormapOption = document.createElement("option");
        comboColormapOption.setAttribute("value", (i + 0.5) / 256.);
        comboColormapOption.innerHTML = colorTableNames[i];
        comboColormap.appendChild(comboColormapOption);
    }
    var comboColormapLabel = document.createElement("label");
    comboColormapLabel.innerHTML = "Colormap:";
    var imagePanel = document.getElementById("imagepanel");
    imagePanel.appendChild(comboColormapLabel);
    imagePanel.appendChild(comboColormap);
    imagePanel.appendChild(document.createElement("br"));
    comboColormap.setAttribute("data-type", "comboColormap");
    comboColormap.addEventListener("change", this, false);
}

solarJPIP.prototype.loadDifferenceCheckbox = function() {
    var differenceCheckboxLabel = document.createElement("label");
    differenceCheckboxLabel.innerHTML = "Difference Image:";

    var differenceBoostboxLabel = document.createElement("label");
    differenceBoostboxLabel.innerHTML = "Boost value:";

    var differenceCheckbox = document.createElement("input");
    differenceCheckbox.setAttribute("type", "checkbox");
    differenceCheckbox.setAttribute("data-type", "checkboxDifference");
    differenceCheckbox.addEventListener("change", this, false);
    var imagePanel = document.getElementById("imagepanel");
    imagePanel.appendChild(differenceCheckboxLabel);
    imagePanel.appendChild(differenceCheckbox);

    var differenceBoostbox = document.createElement("input");
    differenceBoostbox.setAttribute("type", "number");
    differenceBoostbox.setAttribute("data-type", "boostboxDifference");
    differenceBoostbox.setAttribute("min", 0);
    differenceBoostbox.setAttribute("max", 1);
    differenceBoostbox.setAttribute("step", 0.01);
    differenceBoostbox.value = 0.8;

    differenceBoostbox.addEventListener("change", this, false);
    imagePanel.appendChild(differenceBoostboxLabel);
    imagePanel.appendChild(differenceBoostbox);
    imagePanel.appendChild(document.createElement("br"));
}
solarJPIP.prototype.loadAlphaValue = function() {
    var alphaLabel = document.createElement("label");
    alphaLabel.innerHTML = "Alpha value:";
    var alphaBox = document.createElement("input");
    alphaBox.setAttribute("type", "number");
    alphaBox.setAttribute("data-type", "alphabox");
    alphaBox.setAttribute("min", 0);
    alphaBox.setAttribute("max", 1);
    alphaBox.setAttribute("step", 0.01);
    alphaBox.value = 1.;
    alphaBox.addEventListener("change", this, false);
    var imagePanel = document.getElementById("imagepanel");
    imagePanel.appendChild(alphaLabel);
    imagePanel.appendChild(alphaBox);
    imagePanel.appendChild(document.createElement("br"));
}

solarJPIP.prototype.initBuffers = function(gl) {
    this.initVerticesBuffers(gl);
    this.initTextureCoordBuffers(gl);
    this.initIndicesBuffers(gl);
}
solarJPIP.prototype.initVerticesBuffers = function(gl) {
    this.verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    var vertices = [ -1.0, -1.0, 0.0, -1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, -1.0, 0.0, ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}
solarJPIP.prototype.initTextureCoordBuffers = function(gl) {
    this.verticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesTextureCoordBuffer);
    var textureCoordinates = [ 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
}
solarJPIP.prototype.initIndicesBuffers = function(gl) {
    this.verticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);
    this.vertexIndices = [ 0, 1, 2, 0, 2, 3, ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertexIndices), gl.STATIC_DRAW);
}

solarJPIP.prototype.initTextures = function() {
    td = this;
    JPIP.prototype.onload = function(data) {
        if (data[0] == "meta") {
            var metadata = data[5];
            td.parseXML(metadata);
            td.metadataInitialized = true;
        }
        var curr = data[4];
        dataObj = {};
        dataObj.data = new Uint8Array(data[1]);
        dataObj.width = data[2];
        dataObj.height = data[3];
        dataObj.index = curr;
        td.textureData.push(dataObj);
    }
    var jpip = new JPIP();
    var jpipConn = jpip.open(this.baseurl, this.imgname, this.size, this.numberOfFrames);
}

solarJPIP.prototype.loadColormapTexture = function(gl) {
    this.colormapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colormapTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.colormapImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

solarJPIP.prototype.loadNewTextures = function(gl) {
    if (this.textureData.length > 0 && this.metadataInitialized) {
        image = this.textureData.pop();
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, image.width, image.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, image.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        var tAndM = {};
        tAndM.texture = texture;
        tAndM.parsedMetadata = this.parsedMetadata[image.index];
        tAndM.plottingMetadata = this.plottingMetadata[image.index];

        this.texturesAndMetadata.push(tAndM);
        this.texturesAndMetadata.sort(function(a, b) {
            return (a.plottingMetadata.dateObs - b.plottingMetadata.dateObs);
        });
        document.getElementById("info").innerHTML = "Loaded " + this.texturesAndMetadata.length + "/" + (this.parsedMetadata.length - 1);
    }
}

solarJPIP.prototype.initShaders = function(gl) {
    if (solarJPIP.prototype.shaderProgram !== undefined) {
        return;
    }
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    solarJPIP.prototype.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }

    gl.useProgram(this.shaderProgram);

    this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.vertexPositionAttribute);

    this.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(this.textureCoordAttribute);
}

getShader = function(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while (currentChild) {
        if (currentChild.nodeType == 3) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }
    var newShader;

    if (shaderScript.type == "x-shader/x-fragment") {
        newShader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        newShader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(newShader, theSource);
    gl.compileShader(newShader);

    if (!gl.getShaderParameter(newShader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(newShader));
        return null;
    }

    return newShader;
}

solarJPIP.prototype.parseXML = function(metadata) {
    for (var i = 0; i < metadata.length; i++) {
        xmlString = metadata[i];
        if (xmlString[xmlString.length - 1] == "\0") {
            xmlString = xmlString.substring(0, xmlString.length - 1);
        }
        if (window.DOMParser) {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(xmlString, "text/xml");
        } else // IE
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(xmlString);
        }
        keywords = {};
        var fitsElementsNode = xmlDoc.getElementsByTagName("fits");
        numberOfKeywords = 0;
        var helpNN = fitsElementsNode[0].childNodes;
        for (var j = 0; j < fitsElementsNode[0].childNodes.length; j++) {
            vv = helpNN[j].nodeName;
            try {
                if (vv != "#text" && helpNN[j] !== undefined) {
                    keywords[helpNN[j].nodeName] = " " + helpNN[j].childNodes[0].nodeValue;
                    numberOfKeywords++;
                }
            } catch (err) {
                console.log("ERROR in META");
            }
        }
        if (keywords["DATE-OBS"] === undefined && keywords["DATE_OBS"] !== undefined) {
            keywords["DATE-OBS"] = keywords["DATE_OBS"];
        }
        this.parsedMetadata.push(printMetadata(keywords));
        var plotMetadata = {};
        plotMetadata.crpix1 = parseFloat(keywords["CRPIX1"], 10) - 1;
        plotMetadata.crpix2 = parseFloat(keywords["CRPIX2"], 10) - 1;
        plotMetadata.dsunObsMeters = parseFloat(keywords["DSUN_OBS"]);
        plotMetadata.dsunObsKilometers = plotMetadata.dsunObsMeters / 1000.;
        var naxis1 = parseInt(keywords["NAXIS1"]);
        var naxis2 = parseInt(keywords["NAXIS2"]);
        var cdelt1 = parseFloat(keywords["CDELT1"]);
        var cdelt2 = parseFloat(keywords["CDELT2"]);
        var rad1 = arcsecondsToRadians(cdelt1 * naxis1 / 2.);
        var rad2 = arcsecondsToRadians(cdelt2 * naxis2 / 2.);

        plotMetadata.meterX = Math.tan(rad1) * plotMetadata.dsunObsMeters;
        plotMetadata.meterY = Math.tan(rad2) * plotMetadata.dsunObsMeters;
        plotMetadata.solarRadiiX = plotMetadata.meterX / solarConstants.radiusMeter;
        plotMetadata.solarRadiiY = plotMetadata.meterY / solarConstants.radiusMeter;
        plotMetadata.x0 = (plotMetadata.crpix1 - 0.5) / naxis1 - 0.5;
        plotMetadata.y0 = (plotMetadata.crpix2 - 0.5) / naxis2 - 0.5;
        try {
            plotMetadata.dateObs = parseDate(keywords["DATE-OBS"], 1);
        } catch (err) {
            if (keywords["DATE-OBS"] !== undefined) {
                console.log(keywords["DATE-OBS"]);
            } else {
                console.log("DATE-OBS not defined");
            }
            console.log("ERROR parsing metadata:" + err);
        }
        this.plottingMetadata.push(plotMetadata);
    }
}

solarJPIP.prototype.binarySearch = function(key) {
    var array = this.texturesAndMetadata;
    var lo = 0, hi = array.length - 1, mid, element;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid].plottingMetadata.dateObs;
        if (element < key) {
            lo = mid + 1;
        } else if (element > key) {
            hi = mid - 1;
        } else {
            return mid;
        }
    }
    return mid;
}
function printMetadata(keywords) {
    var metadataHtml = "<ul>";
    var keys = [];
    for ( var key in keywords) {
        keys.push(key);
    }
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        if (this.keywords[keys[i]].length < 40) {
            if (keys[i][0] == "D" || keys[i][0] == "C") {
                metadataHtml += "<li>" + keys[i] + " : " + this.keywords[keys[i]] + "</li>";
            }
        }
    }
    metadataHtml += "<li>" + "test" + "</li>";
    metadataHtml += "</ul>";
    return metadataHtml;
}
