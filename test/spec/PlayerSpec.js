describe("LOADSWAP", function() {
  var jpip;
  var dataObjs = [];
  beforeEach(function(done) {
    jpip = new JPIP();
    JPIP.prototype.onload = function(data) {
        if (data[0] == "meta") {
            var metadata = data[5];
        }
        var curr = data[4];
        dataObj = {};
        dataObj.data = new Uint8Array(data[1]);
        dataObj.width = data[2];
        dataObj.height = data[3];
        dataObj.index = data[4];
        dataObjs.push(dataObj);
        if(dataObjs.length == 2){
            done();
        }
    }
    JPIP.prototype.onclose = function(){
        console.log("HERERE");
    }
    var jpipConn = jpip.open("http://localhost:8090/", "SWAP.jpx", 256, 3);
  });

  it("should be able to load a jpx", function(done) {
    expect(dataObjs[0].width).toBe(256);
    for(var i=0; i<dataObjs.length; i++){
        expect(dataObjs[i].height).toBe(256);
    }
    done();
  });

});
describe("LOADAIA", function() {
  var jpip;
  var dataObjs = [];
  beforeEach(function(done) {
    jpip = new JPIP();
    JPIP.prototype.onload = function(data) {
        if (data[0] == "meta") {
            var metadata = data[5];
        }
        var curr = data[4];
        dataObj = {};
        dataObj.data = new Uint8Array(data[1]);
        dataObj.width = data[2];
        dataObj.height = data[3];
        dataObj.index = data[4];
        dataObjs.push(dataObj);
        if(dataObjs.length == 2){
            done();
        }
    }
    JPIP.prototype.onclose = function(){
        console.log("HERERE");
    }
    var jpipConn = jpip.open("http://localhost:8090/", "AIA.jpx", 256, 3);
  });

  it("should be able to load a second jpx", function(done) {
    expect(dataObjs[0].width).toBe(256);
    for(var i=0; i<dataObjs.length; i++){
        expect(dataObjs[i].height).toBe(256);
    }
    done();
  });

});
