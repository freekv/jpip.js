//Experimental write to file
function writeUint8ToFile(uint8array, filename) {
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function(fs) {
        fs.root.getFile(filename, {
            create : true
        }, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                var blob = new Blob([ uint8array ]);
                fileWriter.addEventListener("writeend", function() {
                    location.href = fileEntry.toURL();
                }, false);
                fileWriter.write(blob);
            }, function() {
            });
        }, function() {
        });
    }, function() {
    });
}
function log2(x) {
    var n = 1, i = 0;
    while (x > n) {
        n <<= 1;
        i++;
    }
    return i;
}
function readUINT8(uint) {
    b = [];
    for (var i = 0; i < 8; i++)
        b[i] = (uint >> (7 - i)) & 1;
    return b;
}
function readUint32(data, offset) {
    return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
}
function readUint16(data, offset) {
    return (data[offset] << 8) | data[offset + 1];
}
// Logging
var debug = function(txt) {
    console.log("DEBUG" + txt);
};
var info = function(txt) {
    console.log("INFO" + txt);
};
var warn = function(txt) {
    console.log("WARN" + txt);
};
var error = function(txt) {
    console.log("ERROR" + txt);
};
// Requesting data
var getJSON = function(url, successHandler, errorHandler) {
    var xhr = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    xhr.open('get', url, true);
    xhr.onreadystatechange = function() {
        var status;
        var data;
        if (xhr.readyState == 4) { // `DONE`
            status = xhr.status;
            if (status == 200) {
                data = JSON.parse(xhr.responseText);
                successHandler && successHandler(data);
            } else {
                errorHandler && errorHandler(status);
            }
        }
    };
    xhr.send();
};

// Parsing dates
function parseDate(input) {
    var year = parseInt(input.substr(1, 4), 10);
    var month = parseInt(input.substr(6, 2), 10);
    var day = parseInt(input.substr(9, 2), 10);
    var hours = parseInt(input.substr(12, 2), 10);
    var minutes = parseInt(input.substr(15, 2), 10);
    var seconds = parseInt(input.substr(18, 2), 10);
    var date = Date.UTC(year, month, day, hours, minutes, seconds, 0);
    return date;
}
// Conversion of units functions
function arcsecondsToRadians(arcsec) {
    var radians;
    radians = arcsec * Math.PI / 648000;
    return radians;
}
function radiansToArcseconds(radians) {
    var arcsec;
    arcsec = radians / Math.PI * 648000;
    return arcsec;
}
