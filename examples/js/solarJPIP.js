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
}

solarJPIP.prototype.render = function(perspectiveMatrix, mvMatrix) {
    if (this.parsedMetadata.length > 0) {
        this.currentIndex = (this.currentIndex + 1) % this.parsedMetadata.length;
    }
    if (this.texturesAndMetadata[this.currentIndex] === undefined) {
        this.currentIndex = 0;
    }
    if (this.initialized && this.visible && this.texturesAndMetadata[this.currentIndex] !== undefined) {
        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesTextureCoordBuffer);
        gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texturesAndMetadata[this.currentIndex].texture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.colormapTexture);

        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uSampler"), 0);
        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uColormap"), 1);
        gl.uniform3f(gl.getUniformLocation(this.shaderProgram, "center"), 2. * this.texturesAndMetadata[this.currentIndex].plottingMetadata.x0 - 1., 2. * this.texturesAndMetadata[this.currentIndex].plottingMetadata.y0 - 1., 0);
        gl.uniform3f(gl.getUniformLocation(this.shaderProgram, "stretch"), this.texturesAndMetadata[this.currentIndex].plottingMetadata.solarRadiiX, this.texturesAndMetadata[this.currentIndex].plottingMetadata.solarRadiiY, 1.);

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
        this.initShaders(gl);
        this.initBuffers(gl);
        this.initTextures(gl);
        this.initialized = true;
    }
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
var ref;
solarJPIP.prototype.initTextures = function() {
    td = this;
    JPIP.prototype.onload = function(data) {
        if (data[0] == "meta") {
            var metadata = data[5];
            td.parseXML(metadata);
            td.metadataInitialized = true;
            console.log("METADATA INIT");
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
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
        // tAndM.sort(function(a,b){a.parsedMetadata, b.parsedMetadata});
        this.texturesAndMetadata[image.index] = tAndM;
        document.getElementById("info").innerHTML = "Loaded " + this.texturesAndMetadata.length + "/" + (this.parsedMetadata.length - 1);
    }
}

solarJPIP.prototype.initShaders = function(gl) {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    this.shaderProgram = gl.createProgram();
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
        plotMetadata.x0 = plotMetadata.crpix1 / naxis1;
        plotMetadata.y0 = plotMetadata.crpix2 / naxis2;
        try {
            plotMetadata.dateObs = parseDate(keywords["DATE-OBS"]);
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