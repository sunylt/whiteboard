var autoIncrement;
var getDatByPath = function(obj, path){
	var found = false;
	var propPath = path.split(".");
	r(propPath.shift());

	function r(prop){
		if(typeof prop != "string"){
			return;
		}
		if((typeof obj != "object") || (obj == null)){
			found = false;
			return;
		}
		found = prop in obj;
		if(found){
			obj = obj[prop];
			r(propPath.shift());
		}
	}
	return found ? obj : false;
};
// export {getDatByPath};

var GetQueryString = function(name) {
     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
};

// export {GetQueryString};

var getUniqueId = function (id) { //*******
    // fix: too frequently msg sending will make same id
    if (autoIncrement) {
        autoIncrement++
    } else {
        autoIncrement = 1
    }
    var cdate = new Date();
    var offdate = new Date(2010, 1, 1);
    var offset = cdate.getTime() - offdate.getTime();
    var hexd = offset + autoIncrement;
    return id ? id + hexd.toString() : hexd.toString();
};

function getParams (name){
	var paramsArr = window.location.href.split('?')[1].split('&');
	for (var i = 0; i < paramsArr.length; i++) {
		if (paramsArr[i].indexOf(name) != -1) {
			return paramsArr[i].split('=')[1]
		}
	}
}
// export {getUniqueId};
export{
    getDatByPath,
    GetQueryString,
    getUniqueId,
    getParams
}