import Long from 'long';
import getAll from './all';
import $ from 'jquery';
import io from 'socket.io-client';
import protobuf from 'protobufjs';
import SVG from 'svg.js';
var all = getAll();
var headerUrlRest = "http://turn2.easemob.com:8031";
var headerUrlSock = "http://turn2.easemob.com:8900";
protobuf.util.Long = Long;
protobuf.configure();
var root = protobuf.Root.fromJSON(all);
var autoIncrement;
var messageCache = {};

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
}

var GetQueryString = function(name) {
     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
}
var indexPage = 0;
var roomId = GetQueryString("roomId");
var userId = GetQueryString("userId");
var token = GetQueryString("token");
var socketIOPath = GetQueryString("socketIOPath");
headerUrlSock = GetQueryString("socketIOUrl");
// headerUrlSock = GetQueryString("SocketIOUrl");

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

var formEMFrame = function(buff){

	// var emptyMessage = [];
	var unit8 = new Uint8Array(buff);

	var EMFrame = root.lookup("protobuf.EMFrame");
	var EMFrameMessage = EMFrame.decode(unit8);

	return EMFrameMessage;
}

var makeEnterReq = function(option){

	var emptyMessage = [];
	var EnterReq = root.lookup("protobuf.EnterReq");
	var EnterReqMessage = EnterReq.decode(emptyMessage);
	EnterReqMessage.roomId = option.roomId || roomId;
	EnterReqMessage.token = option.token || token;

	var EMRequest = root.lookup("protobuf.EMRequest");
	var EMRequestMessage = EMRequest.decode(emptyMessage);
	var msgId = getUniqueId(userId);
	EMRequestMessage.proType = 10;
	EMRequestMessage.msgId = msgId + "-1";
	// EMRequestMessage.userId = GetQueryString("userId") || "0TBJKPLWQQ00#0";
	EMRequestMessage.userId = option.userId || userId;

	EMRequestMessage.enterReq = EnterReqMessage;

	var EMFrame = root.lookup("protobuf.EMFrame");
	var EMFrameMessage = EMFrame.decode(emptyMessage);
	EMFrameMessage.emRequest = EMRequestMessage;
	console.log(EMFrameMessage, "客户端发送");
	EMFrameMessage = EMFrame.encode(EMFrameMessage).finish();
	var msgBuffer =  EMFrameMessage.buffer.slice(EMFrameMessage.byteOffset, EMFrameMessage.byteOffset + EMFrameMessage.byteLength);
	//缓存
	var EMFrameMessageCache = EMFrame.decode(emptyMessage);
	EMRequestMessage.msgId = msgId + "-2";
	EMFrameMessageCache.emRequest = EMRequestMessage;
	EMFrameMessageCache = EMFrame.encode(EMFrameMessageCache).finish();
	messageCache[msgId + "-1"] = EMFrameMessageCache.buffer.slice(EMFrameMessageCache.byteOffset, EMFrameMessageCache.byteOffset + EMFrameMessageCache.byteLength);

	return msgBuffer;
}
var makeSheetReq = function(option){
	var emptyMessage = [];
	var SheetReq = root.lookup("protobuf.SheetReq");
	var SheetReqMessage = SheetReq.decode(emptyMessage);
	if(option.type == "ADD"){
		SheetReqMessage.motion = 1;
	}
	else if(option.type == "DELETE"){
		SheetReqMessage.motion = 2;
	}
	else if(option.type == "CHOOSE"){
		SheetReqMessage.motion = 3;
	}
	else if(option.type == "RELOAD"){
		SheetReqMessage.motion = 4;
	}
	// SheetReqMessage.index = option.index;  //*****
	SheetReqMessage.index = option.index ? Number(option.index) : Number(indexPage);

	var EMRequest = root.lookup("protobuf.EMRequest");
	var EMRequestMessage = EMRequest.decode(emptyMessage);
	var msgId = getUniqueId(userId);
	EMRequestMessage.proType = 40;
	EMRequestMessage.msgId = msgId + "-1";
	// EMRequestMessage.userId = GetQueryString("userId") || "0TBJKPLWQQ00#0";
	EMRequestMessage.userId = option.userId || userId;

	EMRequestMessage.sheetReq = SheetReqMessage;

	var EMFrame = root.lookup("protobuf.EMFrame");
	var EMFrameMessage = EMFrame.decode(emptyMessage);
	EMFrameMessage.emRequest = EMRequestMessage;
	console.log(EMFrameMessage, "客户端发送");
	EMFrameMessage = EMFrame.encode(EMFrameMessage).finish();
	var msgBuffer = EMFrameMessage.buffer.slice(EMFrameMessage.byteOffset, EMFrameMessage.byteOffset + EMFrameMessage.byteLength);

	//缓存
	var EMFrameMessageCache = EMFrame.decode(emptyMessage);
	EMRequestMessage.msgId = msgId + "-2";
	EMFrameMessageCache.emRequest = EMRequestMessage;
	EMFrameMessageCache = EMFrame.encode(EMFrameMessageCache).finish();
	messageCache[msgId + "-1"] = EMFrameMessageCache.buffer.slice(EMFrameMessageCache.byteOffset, EMFrameMessageCache.byteOffset + EMFrameMessageCache.byteLength);

	return msgBuffer;
}
var makeActionReq = function(option){
	var emptyMessage = [];
	if(option.oprate == 10 || option.oprate == 11){
		var Coordinates = root.lookup("protobuf.Coordinates");
		var CoordinatesMessageStart = Coordinates.decode(emptyMessage);
		CoordinatesMessageStart.x = option.startX;
		CoordinatesMessageStart.y = option.startY;

		var CoordinatesMessageEnd = Coordinates.decode(emptyMessage);
		CoordinatesMessageEnd.x = option.endX;
		CoordinatesMessageEnd.y = option.endY;

		//矩形
		var Rectangle = root.lookup("protobuf.Rectangle");
		var RectangleMessage = Rectangle.decode(emptyMessage);
		RectangleMessage.start = CoordinatesMessageStart;
		RectangleMessage.end = CoordinatesMessageEnd;
		//圆
		var Roundness = root.lookup("protobuf.Roundness");
		var RoundnessMessage = Rectangle.decode(emptyMessage);
		RoundnessMessage.start = CoordinatesMessageStart;
		RoundnessMessage.end = CoordinatesMessageEnd;
		//画笔
		var Polyline = root.lookup("protobuf.Polyline");
		var PolylineMessage = Polyline.decode(emptyMessage);
		PolylineMessage.path = option.path;

		var Geometry = root.lookup("protobuf.Geometry");
		var GeometryMessage = Geometry.decode(emptyMessage);
		GeometryMessage.id = option.shapId.toString();  //前端生成
		GeometryMessage.penColor = option.penColor;
		GeometryMessage.penDegree = option.penDegree;
		GeometryMessage.createTime = new Date();
		switch(option.shap){
			case "rect":
				GeometryMessage.model = 1;
				GeometryMessage.rectangle = RectangleMessage;
				break;
			case "ellipse":
				GeometryMessage.model = 2;
				GeometryMessage.roundness = RoundnessMessage;
				break;
			case "path":
				GeometryMessage.model = 4;
				GeometryMessage.polyline = PolylineMessage;
				break;
		}
	}
	else if(option.oprate == 20){
		var Geometry = root.lookup("protobuf.Geometry");
		var GeometryMessage = Geometry.decode(emptyMessage);
		GeometryMessage.id = option.shapId.toString();  //前端生成
		switch(option.shap){
			case "rect":
				GeometryMessage.model = 1;
				break;
			case "ellipse":
				GeometryMessage.model = 2;
				break;
			case "path":
				GeometryMessage.model = 4;
				break;
		}
	}
	// GeometryMessage.model = option.shap;    //画的图形 需要case

	var Action = root.lookup("protobuf.Action");
	var ActionMessage = Action.decode(emptyMessage);
	ActionMessage.bordIndex = option.bordIndex || Number(indexPage);
	ActionMessage.op = option.oprate || 10;         //case
	ActionMessage.geometry = GeometryMessage;

	var ActionReq = root.lookup("protobuf.ActionReq");
	var ActionReqMessage = ActionReq.decode(emptyMessage);
	ActionReqMessage.roomId = option.roomId || roomId;
	ActionReqMessage.action = ActionMessage;

	var EMRequest = root.lookup("protobuf.EMRequest");
	var EMRequestMessage = EMRequest.decode(emptyMessage);
	var msgId = getUniqueId(userId);
	EMRequestMessage.token = option.token || token;
	EMRequestMessage.proType = 20;
	EMRequestMessage.msgId = msgId + "-1";
	// EMRequestMessage.userId = GetQueryString("userId") || "userId";
	EMRequestMessage.userId = option.userId || userId;
	EMRequestMessage.actionReq = ActionReqMessage;
	console.log(EMRequestMessage, "客户端发送");

	var EMFrame = root.lookup("protobuf.EMFrame");
	var EMFrameMessage = EMFrame.decode(emptyMessage);
	EMFrameMessage.emRequest = EMRequestMessage;
	EMFrameMessage = EMFrame.encode(EMFrameMessage).finish();
	//unit8 -> arryBuff
	var msgBuffer = EMFrameMessage.buffer.slice(EMFrameMessage.byteOffset, EMFrameMessage.byteOffset + EMFrameMessage.byteLength);
	//缓存
	if(option.oprate != 10){
		var EMFrameMessageCache = EMFrame.decode(emptyMessage);
		EMRequestMessage.msgId = msgId + "-2";
		EMFrameMessageCache.emRequest = EMRequestMessage;
		EMFrameMessageCache = EMFrame.encode(EMFrameMessageCache).finish();
		messageCache[msgId + "-1"] = EMFrameMessageCache.buffer.slice(EMFrameMessageCache.byteOffset, EMFrameMessageCache.byteOffset + EMFrameMessageCache.byteLength);
	}
	return msgBuffer;
}

// var draw = SVG('drawing').size(300, 300)
// var rect = draw.rect(100, 100).attr({ fill: '#f06' })

SVG.on(document, 'DOMContentLoaded', function() {
	var windowWidth = $(window).width()*0.8;
	var windowHeight = $(window).height()*0.8;
	var viewBoxVal = "0 0 2800 2100";
	var viewBoxWidth = viewBoxVal.split(" ")[2];
    var viewBoxHeight = viewBoxVal.split(" ")[3];
	var tool = {};
	tool.shape = '';
	tool.stroke = '#000';
	tool.strokeWidth = 10;
	var currentObj;
	var currentObjData = {};
	var socket;
	var offsetLeft;
	var offsetTop;
	var draw = SVG('drawing')
	.attr({
		viewBox: viewBoxVal,
		id: "drawSvg",
		fill: '#fff'
	});
	var _resizeSvg = function(){
		windowWidth = $(window).width()*0.8;
		windowHeight = $(window).height()*0.8;
		if(windowWidth*viewBoxHeight/viewBoxWidth <= windowHeight){
		    var setWidth = windowWidth;
		    var setHeight = (setWidth * viewBoxHeight) / viewBoxWidth;
		    draw.attr("width", setWidth);
		    draw.attr("height", setHeight);
	    }
	    else if(windowWidth*viewBoxHeight/viewBoxWidth > windowHeight){
	    	var setHeight = windowHeight;
		    var setWidth = (setHeight * viewBoxWidth) / viewBoxHeight;
		    draw.attr("width", setWidth);
		    draw.attr("height", setHeight);
	    }
		offsetLeft = $("#drawSvg").offset().left;
		offsetTop = $("#drawSvg").offset().top;
	}
	
	_resizeSvg();

	var _deleteCacheMsg = function(EMFrame){
		var msgId = getDatByPath(EMFrame, "ackMsg.msgId");
		msgId && delete messageCache[msgId];
	}
	var initSocket = function(){
		socket = io(headerUrlSock, {
			path: socketIOPath
		});
		socket.on('connect', function(){
			setTimeout(function(){
				socket.emit("protobuf", makeEnterReq({}),function(e){
					_deleteCacheMsg(formEMFrame(e));
					console.log("enter ack function:", formEMFrame(e));
				})
			},0);

			socket.on("protobuf",function(res){          //respone的事件
				console.log("respone的事件",formEMFrame(res));
				var data = formEMFrame(res);
				switch(getDatByPath(data, "emResponse.proType")){
					case 10:       //确定enter成功
						console.log("进入白板成功！！！！！！！！！！！");
						initView();
						indexPage = getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.index") ? getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.index") : 0;
						$("#currentPage").text(Number(indexPage) + 1);
						var currentBoardBackground = getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.background");
						_onDrawBackgroud(currentBoardBackground);
						var mapGeometry = getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.mapGeometry");
						// console.log(mapGeometry,888);
						$.each(mapGeometry, function(k,i){
							_onDrawGeometry(i, {
								op: 10
							});
						})
						socket.emit("protobuf", makeSheetReq({
			    			type: "RELOAD",
			    			// type: "CHOOSE",
			    			// index: 0
			    		}), function(e){
			    			_deleteCacheMsg(formEMFrame(e));
			    			console.log("reload ack", formEMFrame(e));
			    		})
						break;
					case 20:   //start 的时候确定层级
						var coverage = getDatByPath(data, "emResponse.actionRsp.action.geometry.coverage");
						// console.log(data, "结束");
						break;
					case 40:
						var boards = getDatByPath(data, "emResponse.sheetRsp.boards");
						$("#allPage").text(boards.length);
				}
			});

			socket.on("binaryResponse",function(data){   		//广播的事件
				console.log(555,formEMFrame(data));
				var formData = formEMFrame(data);
				switch(getDatByPath(formData, "emResponse.boardcastResponse.category")){
					case 1:
						var geometry = getDatByPath(formData, "emResponse.boardcastResponse.action.geometry");
						var action = getDatByPath(formData, "emResponse.boardcastResponse.action");
						_onDrawGeometry(geometry, action);
						break;
					case 2:
						var boards = getDatByPath(formData, "emResponse.boardcastResponse.boards");
						$("#allPage").text(boards.length);
						break;
					case 3:
						// var mapGeometry = getDatByPath(data, "emResponse.boardcastResponse.currentBoard.mapGeometry");
						indexPage = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.index") ? getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.index") : 0;
						$("#currentPage").text(Number(indexPage) + 1);
						var currentBoardBackground = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.background");
						_onDrawBackgroud(currentBoardBackground);
						var mapGeometry = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.mapGeometry");
						$.each(mapGeometry, function(k,i){
							_onDrawGeometry(i, {
								op: 10
							});
						})
						break;
					case 4:
						// console.log("ALL_PAGE",formData);
						indexPage = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.index") ? getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.index") : 0;
						$("#currentPage").text(Number(indexPage) + 1);
						var boards = getDatByPath(formData, "emResponse.boardcastResponse.boards");
						$("#allPage").text(boards.length);

						var currentBoardBackground = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.background");
						_onDrawBackgroud(currentBoardBackground);
						var mapGeometry = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.mapGeometry");
						$.each(mapGeometry, function(k,i){
							_onDrawGeometry(i, {
								op: 10
							});
						})
						break;
				}
			});

			socket.on("disconnect", function(res){
				console.log(res, 888);
			})
		});

	}

	var initView = function(){
	 	$(window).resize(function(){
		    _resizeSvg();
		});
		$(window).keydown(function(e){
			console.log(e);
		});
		draw.on("mousedown", _mousedownEvtStart);
	 	draw.on("mouseup", _mousedownEvtEnd);
	 	draw.on("touchstart", _mousedownEvtStart);
	 	draw.on("touchend", _mousedownEvtEnd);
	 	//工具条
	 	$(".oprate a").off("click");
		$(".oprate a").on("click", function(e){
			e.stopPropagation();
			// e.preventDefault();
			console.log($(e.target).data("type"));
	    	if($(e.target).parent().data("type")){
	    		tool.shape = $(e.target).parent().data("type");
		    	$("#drawing").removeClass();
		    	$("#drawing").addClass($(e.target).parent().data("type") + "Cursor");
	    	}
	    	if($(e.target).parent().data("color")){
	    		// tool.stroke = $(e.target).parent().data("color");
	    		if(tool.stroke == "#000"){
	    			tool.stroke = "red";
	    		}
	    		else{
	    			tool.stroke = "#000";
	    		}
	    	}
	    	if($(e.target).parent().data("oprate") == "clear"){
	    		socket.emit("protobuf", makeActionReq({
					oprate: 40,            //清屏  clear 
				}), function(e){
					_deleteCacheMsg(formEMFrame(e));
					console.log("clear ack function:", formEMFrame(e));
				})
	    		// draw.clear();
	    	}
	    	else if($(e.target).parent().data("oprate") == "undo"){
	    		socket.emit("protobuf", makeActionReq({
					oprate: 98,            //撤销  undo 
				}), function(e){
					_deleteCacheMsg(formEMFrame(e));
					console.log("undo ack function:", formEMFrame(e));
				})
	    	}
	    	else if($(e.target).parent().data("oprate") == "redo"){
	    		socket.emit("protobuf", makeActionReq({
					oprate: 99,            //恢复 redo
				}), function(e){
					_deleteCacheMsg(formEMFrame(e));
					console.log("redo ack function:", formEMFrame(e));
				})
	    	}
	    	else if($(e.target).parent().data("oprate") == "reload"){
	    		socket.emit("protobuf", makeSheetReq({
	    			type: "RELOAD",
	    			// type: "CHOOSE",
	    			// index: 0
	    		}), function(e){
	    			_deleteCacheMsg(formEMFrame(e));
	    			console.log("reload ack", formEMFrame(e));
	    		})
	    	}
	    	else if($(e.target).parent().data("oprate") == "choose"){
	    		socket.emit("protobuf", makeSheetReq({
	    			// type: "RELOAD",
	    			type: "CHOOSE",
	    			index: String(Number($("#testChoose").val())-1)
	    		}), function(e){
	    			_deleteCacheMsg(formEMFrame(e));
	    			console.log("CHOOSE ack", formEMFrame(e));
	    		})
	    	}
	    	else if($(e.target).parent().data("oprate") == "add"){
	    		socket.emit("protobuf", makeSheetReq({
	    			// type: "RELOAD",
	    			type: "ADD",
	    			// index: $("#testChoose").val() ? Number($("#testChoose").val())-1 : indexPage
	    		}), function(e){
	    			_deleteCacheMsg(formEMFrame(e));
	    			console.log("ADD ack", formEMFrame(e));
	    		})
	    	}
	    	else if($(e.target).parent().data("oprate") == "del"){
	    		socket.emit("protobuf", makeSheetReq({
	    			// type: "RELOAD",
	    			type: "DELETE",
	    			// index: $("#testChoose").val() ? Number($("#testChoose").val())-1 : indexPage
	    		}), function(e){
	    			_deleteCacheMsg(formEMFrame(e));
	    			console.log("DELETE ack", formEMFrame(e));
	    		})
	    	}
	    	e.preventDefault();

	    });

	    //上传文档
	    var url = headerUrlRest + "/222/111/upload/" + userId;
	    $("#chatVideo").on("change", function(e){
	    	// var file = getFileUrl(document.getElementById('chatVideo'));
	    	var fileObj = document.getElementById('chatVideo');
	    	var file = fileObj.files[0];
	    	console.log(file, fileObj.files);

	    	var form = new FormData(); // FormData 对象
            form.append("file", file); // 文件对象
            $(this).val("");

            var xhr = new XMLHttpRequest();  // XMLHttpRequest 对象
            xhr.open("post", url); //post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
            xhr.onload = uploadComplete; //请求完成
            xhr.onerror =  uploadFailed; //请求失败

            xhr.upload.onprogress = progressFunction;//【WhiteBoardService上传进度调用方法实现】
            xhr.upload.onloadstart = function(){//上传开始执行方法
                // ot = new Date().getTime();   //设置上传开始时间
                // oloaded = 0;//设置上传开始时，以上传的文件大小为0
                console.log("start");
            };
            // xhr.setRequestHeader('Content-Type', 'multipart/form-data');
            xhr.send(form); //开始上传，发送form数据
            var uploadComplete = function(e){
            	console.log(e, "uploadComplete");
            }
            var uploadFailed = function(e){
            	console.log(e, "uploadFailed");
            }
            var progressFunction = function(e){
            	console.log(e, "progressFunction");
            }
	    });
	    $(".left").on("click", _changPage);
	    $(".right").on("click", _changPage);
	}

	initSocket();

	var _changPage = function(e){
		var page;
		if(indexPage && $(e.target).parent().hasClass("left")){
			page = Number(indexPage) - 1;
		}
		if($(e.target).parent().hasClass("right")){
			page = Number(indexPage) + 1;
		}
		socket.emit("protobuf", makeSheetReq({
			type: "CHOOSE",
			index: String(page)
		}), function(e){
			_deleteCacheMsg(formEMFrame(e));
			console.log("CHOOSE ack", formEMFrame(e));
		})
	}
	var _onDrawBackgroud = function(url){
		SVG.get("imgBackgroud") && SVG.get("imgBackgroud").remove();
		draw.clear();
		if(url){
			draw.
			image('//' + url, "100%", "100%")
			.attr("id","imgBackgroud")
			.back();
		}
	}
	

	var _onDrawGeometry = function(geometry, action){
		// _clearView();
		// var action = data.emResponse.boardcastResponse.action
		// var geometry = action.geometry;
		var obj = SVG.get(geometry.id);
		var option = {
			fill: 'none'
			, stroke: geometry.penColor || tool.stroke
			, 'stroke-width': geometry.penDegree
			, id: geometry.id
		}
		if( action.op == 10 ){     //绘制元素
			switch(geometry.model){
				case 1:
					if(!obj){
						obj = draw.group().rect()
						.attr(option)
					}
					obj
					.move(Math.min(geometry.rectangle.start.x, geometry.rectangle.end.x), Math.min(geometry.rectangle.start.y, geometry.rectangle.end.y))
					.size(Math.abs(geometry.rectangle.start.x - geometry.rectangle.end.x),  Math.abs(geometry.rectangle.start.y - geometry.rectangle.end.y))
					break;
				case 2:
					if(!obj){
						obj = draw.group().ellipse()
						.attr(option);
					}
					//同样参数move 2次，是因为svg 里ellipse 的move方法bug，只移动一次move作用的是cx\cy，而不是x\y
					obj
					.move(Math.min(geometry.roundness.start.x, geometry.roundness.end.x), Math.min(geometry.roundness.start.y, geometry.roundness.end.y))
					.size(Math.abs(geometry.roundness.start.x - geometry.roundness.end.x),  Math.abs(geometry.roundness.start.y - geometry.roundness.end.y))
					.move(Math.min(geometry.roundness.start.x, geometry.roundness.end.x), Math.min(geometry.roundness.start.y, geometry.roundness.end.y))
					break;
				case 3:
					break;
				case 4:
					if(!obj){
						obj = draw.group().path()
						.attr(option);
					}
					obj
					.plot(geometry.polyline.path);
					break;
			}
			obj && obj.off("click");
			obj && obj.on("click", function(e){
				if(tool.shape == "eraser"){
					socket.emit("protobuf", makeActionReq({
							shapId: this.attr("id"),
							oprate: 20,      //删除  remove
							shap: this.node.tagName
						}), function(e){
						_deleteCacheMsg(formEMFrame(e));
						console.log("delete ack function:", formEMFrame(e));
					})
				}
			})
		}
		else if(action.op == 20){     //删除元素
			obj.parent().remove();
		}
		else if(action.op == 11){     //结束一个元素绘制
			return;
		}
		else if(action.op == 40){      //清空画板
			_clearView();
		}
	}

	var _clearView = function(){
		$("g").remove()
		// var url = SVG.get("imgBackgroud") && SVG.get("imgBackgroud").attr("href");
		// draw.clear();
		// _onDrawBackgroud(url);
	}
	var _mousedownEvtStart = function(e){
		e.stopPropagation();
		if(e.button != 2 && e.button != 1){
			var x = (e.pageX - offsetLeft)*viewBoxWidth/draw.attr("width");
			var y = (e.pageY - offsetTop)*viewBoxHeight/draw.attr("height");
			if(e.touches && e.touches[0]){
				x = (Number(e.touches[0].pageX) - offsetLeft)*viewBoxWidth/draw.attr("width");;
				y = (Number(e.touches[0].pageY) - offsetTop)*viewBoxHeight/draw.attr("height");
			}
			currentObjData.initX = x;
			currentObjData.initY = y;
			var option = {
				fill: 'none'
				, stroke: tool.stroke
				, 'stroke-width': tool.strokeWidth
				, id: getUniqueId()
			}
			switch(tool.shape){
				case "select":
					break;
				case "rect":
					currentObj = draw.group()
					.rect()
					.attr(option)
					// .fill('./svg.PNG')
					.move(x, y);

					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "rect",
					}))

					// draw.on("mousemove", _mousedownEvtMove);
					break;
				case "circle":
					currentObj = draw.group()
					.ellipse()
					.attr(option)
					.move(x, y);
					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "ellipse",
					}))
					// draw.on("mousemove", mousedownEvtMove);
					break;
				case "pen":
					currentObj = draw.group()
					.path('M'+ x +' ' + y)
					.attr(option);
					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "path",
					}))
			}
			draw.on("mousemove", _mousedownEvtMove);
			draw.on("touchmove", _mousedownEvtMove);
		}

	}

	var _mousedownEvtMove = function(e){
		e.stopPropagation();
		console.log('move');
		var x = (e.pageX - offsetLeft)*viewBoxWidth/draw.attr("width");
		var y = (e.pageY - offsetTop)*viewBoxHeight/draw.attr("height");
		if(e.touches && e.touches[0]){
			x = (Number(e.touches[0].pageX) - offsetLeft)*viewBoxWidth/draw.attr("width");
			y = (Number(e.touches[0].pageY) - offsetTop)*viewBoxHeight/draw.attr("height");
		}
		if(currentObj){
			switch(tool.shape){
				case "select":
					break;
				case "rect":
					currentObj
					.move(Math.min(currentObjData.initX, x), Math.min(currentObjData.initY, y))
					.size(Math.abs(currentObjData.initX - x),  Math.abs(currentObjData.initY - y))
					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "rect",
						startX: currentObjData.initX,
						startY: currentObjData.initY,
						endX: x,
						endY: y
					}))
					break;
				case "circle":
					currentObj
					.move(Math.min(currentObjData.initX, x), Math.min(currentObjData.initY, y))
					.size(Math.abs(currentObjData.initX - x),  Math.abs(currentObjData.initY - y));

					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "ellipse",
						startX: currentObjData.initX,
						startY: currentObjData.initY,
						endX: x,
						endY: y
					}))
					break;
				case "pen":
					var pathOld = currentObj.attr("d");
					var pathNew = pathOld + "L" + x + " " + y;
					currentObj.plot(pathNew);
					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "path",
						path: pathNew
					}))
			}
		}
	}

	var _mousedownEvtEnd = function(e){ 
		e.stopPropagation();
		if(currentObj){
			currentObj.on("click", function(e){
				if(tool.shape == "eraser"){
					socket.emit("protobuf", makeActionReq({
							shapId: this.attr("id"),
							oprate: 20,      //删除  remove
							shap: this.node.tagName
						}), function(e){
						_deleteCacheMsg(formEMFrame(e));
						console.log("delete ack function:", formEMFrame(e));
					})
				}
			})
			socket.emit("protobuf", makeActionReq({
				shapId: currentObj.attr("id"),
				oprate: 11,            //绘制结束 draw_end
				penColor: tool.stroke,
				penDegree: tool.strokeWidth,
				shap: currentObj.node.tagName,
			}), function(e){
				_deleteCacheMsg(formEMFrame(e));
				console.log("end ack function:", formEMFrame(e));
			})
			draw.off("mousemove");
			currentObj = null;
		}
	}

})
