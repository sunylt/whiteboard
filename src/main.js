// import Long from 'long';
import $ from 'jquery';
import io from 'socket.io-client';
import SVG from 'svg.js';
import Hammer from 'hammerjs';
import svgPanZoom from 'svg-pan-zoom';

import {getDatByPath, GetQueryString, getUniqueId, getParams} from './utils';
import formEMFrame from './handleResponse/formEMFrame';
import makeEnterReq from './handleRequst/makeEnterReq';
import makeSheetReq from './handleRequst/makeSheetReq';
import makeActionReq from './handleRequst/makeActionReq';
import messageCache from './messageCache';
import imgUrl from '../icon/page.png'

var headerUrlRest = (window.location.protocol === 'https:' ? 'https:' : 'http:') + "//rtc-turn4-hsb.easemob.com";
var headerUrlSock = (window.location.protocol === 'https:' ? 'https:' : 'http:') + "//rtc-turn4-hsb.easemob.com";


var indexPage = 0;
// var roomId = GetQueryString("roomId");
var userId = GetQueryString("userId");
// var token = GetQueryString("token");
var socketIOPath = GetQueryString("socketIOPath");
var appkey = getParams("appKey");
headerUrlRest = GetQueryString("domainName");
headerUrlSock = GetQueryString("socketIOUrl");
console.log(headerUrlRest);
var isCreater = getParams("isCreater") == 'true'? true: false;
// var isCreater = true;

// var draw = SVG('drawing').size(300, 300)
// var rect = draw.rect(100, 100).attr({ fill: '#f06' })
var initMainView = function() {
    var scale = 0.8;
	var windowWidth = $(window).width()*scale;
	var windowHeight = $(window).height()*scale;
	var viewBoxVal = "0 0 2800 2100";
	var viewBoxValues = viewBoxVal.split(" ");
	var viewBoxWidth = viewBoxVal.split(" ")[2];
    var viewBoxHeight = viewBoxVal.split(" ")[3];
	var tool = {};
	tool.shape = '';
	tool.stroke = '#000';
	tool.strokeWidth = 10;
	var currentObj;
	var currentObjData = {};
	var initPostion = {};
	var pathStr = "";
	var initWidth;
	var relativeInitWidh;
	var svgWidth;
	var svgHeight;
	var socket;
	var offsetLeft;
	var offsetTop;
	var isEraser = false;
	var draw = SVG('drawsvgContainer')
	.attr({
		viewBox: viewBoxVal,
		id: "drawSvg",
		fill: '#fff'
	});
	
	var _resizeSvg = function(){
		windowWidth = $(window).width()*scale;
		windowHeight = $(window).height()*scale;
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
		$(".svg_backgroud")
		.css({
			width:draw.attr("width"),
			height: draw.attr("height"),
		})
		$("#drawsvgContainer")
		.css({
			width:draw.attr("width"),
			height: draw.attr("height"),
		})
		svgWidth = draw.attr("width");
		svgHeight = draw.attr("height");
		// $("#drawsvgContainer").css({
		// 	transform: "scale(" + windowWidth/initWith +")"
		// })
		// var newWidth = draw.attr("width");
		// if(initWidth > 0){
		// 	$.each($(".textArea"), function(i,v){
		// 		var top = ($(v).css("top")).split("p")[0]*newWidth/relativeInitWidh;
		// 		var left = ($(v).css("left")).split("p")[0]*newWidth/relativeInitWidh;
		// 		var scale = ($(v).css("transform")).split("scale")[1]*newWidth/relativeInitWidh;
		// 		$(v).css({
		// 			top: top,
		// 			left: left,
		// 			transform: "scale(" + scale +")"
		// 		})
		// 	})
		// }
		offsetLeft = $("#drawSvg").offset().left;
		offsetTop = $("#drawSvg").offset().top;
	}

	var _initZoomPan = function(){
		var hammertime = new Hammer(document.querySelector('#drawSvg')); 
		hammertime.get('pinch').set({ enable: true });
		// hammertime.get('rotate').set({ enable: true });
		hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
		var svgPositionInit = {};
		var top;
		var left;
		hammertime.on("pinchstart pinchend pinchin pinchout panstart panmove panend", function (ev) {
			if(tool.shape != "text" || tool.shape != "pen" || tool.shape != "rect" || tool.shape != "circle"){      //增加判断条件
				switch (ev.type) {
					case "pinchstart":
						break;
					case "pinchin":
						zoom(ev.scale);
						break;
					case "pinchout":
						zoom(ev.scale, true);
						break;
					case "pinchend":
						viewBoxValues = draw.attr("viewBox").split(' ');
						viewBoxWidth = viewBoxValues[2];
						viewBoxHeight = viewBoxValues[3]; 
						if(ev.additionalEvent == "pinchout"){
							svgWidth = draw.attr("width");
							svgHeight = draw.attr("height");
						}
						break;
					case "panstart":
						svgPositionInit.x = ev.center.x;
						svgPositionInit.y = ev.center.y;
						top = parseInt($("#drawSvg").css("top"));
						left = parseInt($("#drawSvg").css("left"));
						break;
					case "panmove":
						var newLeft = ev.center.x - svgPositionInit.x + left > 0 ? 0 : ev.center.x - svgPositionInit.x + left;
						var newTop = ev.center.y - svgPositionInit.y + top > 0 ? 0 : ev.center.y - svgPositionInit.y + top;
						if(Math.abs(newLeft) > svgWidth - $("#drawsvgContainer").css("width").split("px")[0]){
							newLeft = -(svgWidth - $("#drawsvgContainer").css("width").split("px")[0]);
						}
						if(Math.abs(newTop) > svgHeight - $("#drawsvgContainer").css("height").split("px")[0]){
							newTop = -(svgHeight - $("#drawsvgContainer").css("height").split("px")[0]);
						}
						$("#drawSvg")
						.css({
							left: newLeft,
							top: newTop
						})
						offsetLeft = $("#drawSvg").offset().left;
						offsetTop = $("#drawSvg").offset().top;
					break;
					case "panend":
					console.log(ev, "panend");
					break;
				}
			}
		});

		function zoom(num,isOut) {
			viewBoxValues[2] =viewBoxWidth /num;
			viewBoxValues[3] =viewBoxHeight /num;
			draw.attr("viewBox",viewBoxValues.join(" "));
			if(isOut){
				draw.attr("width", svgWidth*num);
				draw.attr("height", svgHeight*num);
			}
			else if(draw.attr("width") > $("#drawsvgContainer").css("width").split("px")[0] && draw.attr("height") > $("#drawsvgContainer").css("height").split("px")[0]){
				draw.attr("width", svgWidth*num);
				draw.attr("height", svgHeight*num);
			}
			// viewBoxValues[2] =viewBoxWidth /num;
			// viewBoxValues[3] =viewBoxHeight /num;
			console.log(num, viewBoxWidth, viewBoxValues[2]);
			console.log(num, svgWidth, svgWidth*num);
			// draw.attr("viewBox",viewBoxValues.join(" "));
			$("#drawSvg")
			.css({
				top: 0,
				left: 0
			})
			offsetLeft = $("#drawSvg").offset().left;
			offsetTop = $("#drawSvg").offset().top;
		}
		// var eventsHandler = {
		//   haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel']
		// , init: function(options) {
		// 	var instance = options.instance
		// 	  , initialScale = 1
		// 	  , pannedX = 0
		// 	  , pannedY = 0
		// 	// Init Hammer
		// 	// Listen only for pointer and touch events
		// 	this.hammer = Hammer(options.svgElement, {
		// 	  inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
		// 	})
		// 	// Enable pinch
		// 	this.hammer.get('pinch').set({enable: true})
		// 	// Handle double tap
		// 	this.hammer.on('doubletap', function(ev){
		// 	  instance.zoomIn()
		// 	})
		// 	// Handle pan
		// 	this.hammer.on('panstart panmove', function(ev){
		// 	  // On pan start reset panned variables
		// 	  if (ev.type === 'panstart') {
		// 		pannedX = 0
		// 		pannedY = 0
		// 	  }
		// 	  // Pan only the difference
		// 	  instance.panBy({x: ev.deltaX - pannedX, y: ev.deltaY - pannedY})
		// 	  pannedX = ev.deltaX
		// 	  pannedY = ev.deltaY
		// 	})
		// 	// Handle pinch
		// 	this.hammer.on('pinchstart pinchmove', function(ev){
		// 	  // On pinch start remember initial zoom
		// 	  if (ev.type === 'pinchstart') {
		// 		initialScale = instance.getZoom()
		// 		instance.zoom(initialScale * ev.scale)
		// 	  }
		// 	  instance.zoom(initialScale * ev.scale)
		// 	})
		// 	// Prevent moving the page on some devices when panning over SVG
		// 	options.svgElement.addEventListener('touchmove', function(e){ e.preventDefault(); });
		//   }
		// , destroy: function(){
		// 	this.hammer.destroy()
		//   }
		// }
		// var element = document.querySelector('#drawSvg');
		// svgPanZoom(element, {
		//   zoomEnabled: true,
		//   controlIconsEnabled: true,
		//   dblClickZoomEnabled: false,
		//   fit: 1,
		//   center: 1, 
		//   customEventsHandler: eventsHandler
		// });
	  }
	
	_resizeSvg();
	_initZoomPan();

	var initSocket = function(){
		socket = io(headerUrlSock, {
			path: socketIOPath
		});
		socket.on('connect', function(res){
			console.log("socket connect success----",res);
			setTimeout(function(){
				socket.emit("protobuf", makeEnterReq({}),function(e){
					_deleteCacheMsg(formEMFrame(e));
					console.log("enter ack function:", formEMFrame(e));
				})
			},0);
			socket.on("protobuf", _responseEvent);
			socket.on("binaryResponse", _dispatcherEvent);
			socket.on("disconnect", function(res){
				console.log("socket断开----",res);
			})
		});
    }
    
    initSocket();

    var _responseEvent = function(res){          //responce的事件
        console.log("response的事件---",formEMFrame(res));
        var data = formEMFrame(res);
        switch(getDatByPath(data, "emResponse.proType")){
            case 10:       //确定enter成功
                console.log("serverce enter responce");
				var masterId = getDatByPath(data, "emResponse.enterRsp.confr.masterId");
				var level = getDatByPath(data, "emResponse.enterRsp.level");

                //_initView(masterId == userId);
                _initView(isCreater,level);

                indexPage = getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.index") ? getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.index") : 0;
                $("#currentPage").text(Number(indexPage) + 1);
                var currentBoardBackground = getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.background");
                _onDrawBackgroud(currentBoardBackground);
                var mapGeometry = getDatByPath(data, "emResponse.enterRsp.confr.currentBoard.mapGeometry");
                $.each(mapGeometry, function(i,v){
                    _onDrawGeometry(v, {
                        op: 9
                    });
				})
                socket.emit("protobuf", makeSheetReq({
                    type: "RELOAD"
                }), function(e){
                    _deleteCacheMsg(formEMFrame(e));
                    console.log("reload ack", formEMFrame(e));
                })
                break;
            case 20:   //start 的时候确定层级
				var coverage = getDatByPath(data, "emResponse.actionRsp.action.geometry.coverage");
				var elementId = getDatByPath(data, "emResponse.actionRsp.action.geometry.id");
				var obj = SVG.get(elementId);
				obj.data("coverageId", coverage);

                break;
            case 40:    //sheet页变化的返回。目前只有load
                var boards = getDatByPath(data, "emResponse.sheetRsp.boards");
                $("#allPage").text(boards.length);
                _unfoldSheets(boards);
        }
    }

    var _dispatcherEvent = function(data){   		//广播的事件
		console.log('广播事件---',formEMFrame(data));
		var page_change = function(formData){
			indexPage = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.index") ? getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.index") : 0;
			$("#currentPage").text(Number(indexPage) + 1);
			var currentBoardBackground = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.background");
			_onDrawBackgroud(currentBoardBackground);
			var mapGeometry = getDatByPath(formData, "emResponse.boardcastResponse.currentBoard.mapGeometry");
			$.each(mapGeometry, function(i,v){
				_onDrawGeometry(v, {
					op: 9
				});
			})
		}
		var sheet_chanage = function(formData){
			var boards = getDatByPath(formData, "emResponse.boardcastResponse.boards");
			$("#allPage").text(boards.length);
			_unfoldSheets(boards);
		}

		var clear_and_end_draw = function(){
			$(".textArea").remove();
			if(currentObj && currentObj.node){
				socket.emit("protobuf", makeActionReq({
					bordIndex: Number(indexPage),
					shapId: currentObj.attr("id"),
					oprate: 11,            //绘制结束 draw_end
					penColor: tool.stroke,
					penDegree: tool.strokeWidth,
					shap: currentObj.node ? currentObj.node.tagName : "text"
				}), function(e){
					_deleteCacheMsg(formEMFrame(e));
					console.log("end ack function:", formEMFrame(e));
				});
				currentObj = null;
			}
		}
		var oprateAuth = function(el){
			if(el > 3){
				$(".member .tool").css({"display":"flex"})
			}
			else{
				$(".member .tool").css({"display":"none"})
			}
		}
		var formData = formEMFrame(data);
		if(getDatByPath(formData, "emResponse.closeRsp.code") === 102){//白板被删除
			console.log("删除白板---");
			_alert("白板删除成功");
			// $(".messageItem").css({display:"inline-block"});
			// setTimeout(function(){
			// 	$(".messageItem").css({display:"none"});
			// 	// window.opener=null;
			// 	// window.open('','_self');
			// 	// window.close();
			// }, 3000)
		}
		else{
			switch(getDatByPath(formData, "emResponse.boardcastResponse.category")){
				case 1:    //action 动作
					var geometry = getDatByPath(formData, "emResponse.boardcastResponse.action.geometry");
					var action = getDatByPath(formData, "emResponse.boardcastResponse.action");
					_onDrawGeometry(geometry, action);
					break;
				case 2:   //SHEET_PAGE缩略图
					clear_and_end_draw();     //特殊处理文本
					sheet_chanage(formData);
					break;
				case 3:   //CURRENT_PAGE当前页
					clear_and_end_draw();        //特殊处理文本
					page_change(formData);
					break;
				case 4:    //ALL_PAGE 当前页&&缩略图
					clear_and_end_draw();     //特殊处理文本
					sheet_chanage(formData);
					page_change(formData);
					break;
				case 5:
					var level =  getDatByPath(formData, "emResponse.boardcastResponse.level");
					oprateAuth(level);
			}
		}
	}

	

	var _initView = function(isAdmin, el){
	 	$(window).resize(function(){
		    _resizeSvg();
		});
        $("body").on("click", _onWindowClick);
        draw.on("click", _drawClick);
		draw.on("mousedown", _mousedownEvtStart);
		draw.on("mouseup", _mousedownEvtEnd);
		$("#drawsvgContainer").on("mouseleave", _mousedownEvtEnd);
	 	draw.on("touchstart", _mousedownEvtStart);
		draw.on("touchend", _mousedownEvtEnd);
	 	//工具条
		$(".tool div").off("click").on("click", _onToolClick);
		$(".colorName a").on("click", _onColorClick);
	    //上传文档
		$("#chatVideo").on("change", function(e){
			_uploadFile(e, false, "chatVideo")
		});
		$("#fileDoc").on("change", function(e){
			_uploadFile(e, true, "fileDoc")
		});
	    $(".left").on("click", _changPage);
        $(".right").on("click", _changPage);
        if(isAdmin){
            $(".tool").css("display","flex");
        }
        else if(el > 3){
            $(".member  .tool").css("display","flex");
		}
		else{
			$(".member  .tool").css("display","none");
		}
	}

	var _onWindowClick = function(e){
		if($(".colorContainer").hasClass("selected")){
			$(".colorContainer").removeClass("selected")
        }
        $(".thumbnailListContainer").removeClass("show").addClass("hide");
	}

	var _onToolClick = function(e){
		if(e.target.id == "chatVideo"){
			return
		}
        e.stopPropagation();
        $(".thumbnailListContainer").removeClass("show").addClass("hide");
		if($(e.target).parent().data("color") || !$(e.target).parent().data("type")){
			if($(".colorContainer").hasClass("selected")){
				$(".colorContainer").removeClass("selected")
			}
			else{
				$(e.target).parent().addClass("selected");
			}
		}
		else if($(e.target).parent().data("type")){
			$(".tool div").removeClass("selected");
			$(e.target).parent().addClass("selected");
		}
		if($(e.target).parent().data("type")){
			tool.shape = $(e.target).parent().data("type");
			$("#drawing").removeClass();
			$("#drawing").addClass($(e.target).parent().data("type") + "Cursor");
        }
        switch($(e.target).parent().data("oprate")){
            case "clear":
                socket.emit("protobuf", makeActionReq({
                    oprate: 40,            //清屏  clear 
                    bordIndex: Number(indexPage)
                }), function(e){
                    _deleteCacheMsg(formEMFrame(e));
                    console.log("clear ack function:", formEMFrame(e));
                });
                break;
            case "undo":
                socket.emit("protobuf", makeActionReq({
                    oprate: 98,            //撤销  undo 
                    bordIndex: Number(indexPage)
                }), function(e){
                    _deleteCacheMsg(formEMFrame(e));
                    console.log("undo ack function:", formEMFrame(e));
                });
                break;
            case "redo":
                socket.emit("protobuf", makeActionReq({
                    oprate: 99,            //恢复 redo
                    bordIndex: Number(indexPage)
                }), function(e){
                    _deleteCacheMsg(formEMFrame(e));
                    console.log("redo ack function:", formEMFrame(e));
                });
                break;
			case "reload":
			
                socket.emit("protobuf", makeSheetReq({
                    type: "RELOAD"
                }), function(e){
					_deleteCacheMsg(formEMFrame(e));
					if($(".thumbnailListContainer").hasClass("hide")){
						$(".thumbnailListContainer").removeClass("hide").addClass("show");
					}
					else{
						$(".thumbnailListContainer").removeClass("show").addClass("hide");
					}
                    console.log("reload ack", formEMFrame(e));
                });
                break;
            case "add":
                socket.emit("protobuf", makeSheetReq({
                    type: "ADD",
                    index: indexPage
                }), function(e){
                    _deleteCacheMsg(formEMFrame(e));
                    console.log("ADD ack", formEMFrame(e));
                });
                break;   
            case "del":
                socket.emit("protobuf", makeSheetReq({
                    type: "DELETE",
                    index: indexPage
                }), function(e){
                    _deleteCacheMsg(formEMFrame(e));
                    console.log("DELETE ack", formEMFrame(e));
                });
                break;   
            default:
                break;
        }
		e.preventDefault();
	}

	var _onColorClick = function(e){
		tool.stroke = $(e.target).parent().data("color");
		$(".colorContainer >img").attr("src", $(e.target).attr("src"));
		$(".colorContainer").removeClass("selected");
	}
	
    var _unfoldSheets = function(list){
        $(".thumbnailList").empty()
        $.each(list, function(i, v){
			var imgUrl = v.background;
			var className = indexPage == i ? '<div class="drawBorder selected">' : '<div class="drawBorder">';
            $(".thumbnailList").append($('<div class="thumbnailItem" data-index='+ i +'>' + className + '<img src='+ imgUrl +'></div><p>'+ (i+1) +'</p></div>'))
        });
        $(".thumbnailItem").off("click").on("click", function(e){
			e.stopPropagation();
			var index = $(this).data('index');
			$(".drawBorder").removeClass("selected");
			$(this).children(".drawBorder").addClass("selected");
            socket.emit("protobuf", makeSheetReq({
                type: "CHOOSE",
                index: index
            }), function(e){
                _deleteCacheMsg(formEMFrame(e));
                console.log("CHOOSE ack", formEMFrame(e));
            });
        })
    }

	var _onDrawBackgroud = function(url){
		$(".svg_backgroud")
		.css({
			width:draw.attr("width"),
			height: draw.attr("height"),
		})
		.attr("src","");
		SVG.get("imgBackgroud") && SVG.get("imgBackgroud").remove();
		draw.clear();
		if(url && url.indexOf("svg") > 0){
			$(".svg_backgroud").attr("src", url);
		}
		else if(url){
			draw.
			image(url, "100%")
			.attr("id","imgBackgroud")
			.back();
		}
	}
	
	var _onDrawGeometry = function(geometry, action){
		var obj = SVG.get(geometry.id);
		var option = {
			fill: 'none'
			, stroke: geometry.penColor || tool.stroke
			, 'stroke-width': geometry.penDegree
			, id: geometry.id
		}
		if( action.op == 9 || action.op == 10 || action.op == 30 ||  action.op == 31){     //10绘制元素;30移动元素
			switch(geometry.model){
				case 1:
					if(action.op == 9){
						obj = draw.group().rect()
						.attr(option)
					}
					obj && obj
					.move(Math.min(geometry.rectangle.start.x, geometry.rectangle.end.x), Math.min(geometry.rectangle.start.y, geometry.rectangle.end.y))
					.size(Math.max(Math.abs(geometry.rectangle.start.x - geometry.rectangle.end.x),0.1),  Math.max(Math.abs(geometry.rectangle.start.y - geometry.rectangle.end.y),0.1))
					break;
				case 2:
					if(action.op == 9){
						obj = draw.group().ellipse()
						.attr(option);
					}
					//同样参数move 2次，是因为svg 里ellipse 的move方法bug，只移动一次move作用的是cx\cy，而不是x\y
					obj && obj
					.move(Math.min(geometry.roundness.start.x, geometry.roundness.end.x), Math.min(geometry.roundness.start.y, geometry.roundness.end.y))
					.size(Math.max(Math.abs(geometry.roundness.start.x - geometry.roundness.end.x),0.1),  Math.max(Math.abs(geometry.roundness.start.y - geometry.roundness.end.y),0.1))
					.move(Math.min(geometry.roundness.start.x, geometry.roundness.end.x), Math.min(geometry.roundness.start.y, geometry.roundness.end.y))
					break;
				case 3:
					break;
				case 4:
					var increment = geometry.polyline.incrementPath;
					if(action.op == 9){
						obj = draw.group().group().path()
						.attr(option);
						increment = geometry.polyline.path;
					}
					var oldPath = obj.attr("d");
					
					var newPath = oldPath + increment;
					obj && obj
					.plot(newPath);
					geometry.polyline.start && obj.parent().move(geometry.polyline.start.x, geometry.polyline.start.y);
					break;

					// if(!$("#" + geometry.id).length){
					// 	obj = $('<div class="textArea"><input /></div>');
					// 	$("#drawsvgContainer").append(obj);
					// }
					// else{
					// 	obj = $("#" + geometry.id);
					// }
					// var cssJson = {
					// 	"border-color": geometry.penColor || tool.stroke,
					// 	color: geometry.penColor || tool.stroke,
					// 	left:JSON.parse(geometry.polyline.path).left,
					// 	top: JSON.parse(geometry.polyline.path).top
					// }
					// obj.css(cssJson).attr("id", geometry.id);
					// obj.children("input")
					// .val(JSON.parse(geometry.polyline.path).value);
					// if(!obj){
					// 	obj = draw.group().text("")
					// 	.attr({
					// 		stroke: geometry.penColor || tool.stroke,
					// 		id: geometry.id,
					// 		fill: geometry.penColor || tool.stroke
					// 	})
					// 	.font({
					// 		family:   'Helvetica'
					// 	  , size:     JSON.parse(geometry.polyline.path).font
					// 	  });
					// }
					// obj
					// .text(JSON.parse(geometry.polyline.path).value)
					// .attr({
					// 	x: JSON.parse(geometry.polyline.path).left,
					// 	y: JSON.parse(geometry.polyline.path).top
					// })
					// break;
				case 5:
					if(action.op == 9){
						obj = draw.group().text("")
						.attr({
							stroke: geometry.penColor || tool.stroke,
							id: geometry.id,
							fill: geometry.penColor || tool.stroke
						})
						.font({
							family:   'Helvetica',
						 	size:     geometry.textBox.fontsize
						});
					}
					obj && obj
					.text(geometry.textBox.content)
					// .move(geometry.textBox.start.x, geometry.textBox.start.y);
					.attr({                 //用move坐标会有误差
						x: geometry.textBox.start.x,
						y: geometry.textBox.start.y
					});
					break;
			}
			obj.data('coverageId', geometry.coverage);
			obj && obj.off("click").on("click", function(e){
				if(tool.shape == "eraser"){
					socket.emit("protobuf", makeActionReq({
							shapId: this.attr("id"),
							oprate: 20,      //删除  remove
                            shap: this.node.tagName,
                            bordIndex: Number(indexPage)
						}), function(e){
						_deleteCacheMsg(formEMFrame(e));
						console.log("delete ack function:", formEMFrame(e));
					})
				}
			});
			obj && obj.off("mousedown").on("mousedown", _moveElementEvent);
			obj && obj.off("touchstart").on("touchstart", _moveElementEvent);

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
    
    var _drawClick = function(e){
        // e.stopPropagation();
        var x = (e.pageX - offsetLeft)*viewBoxWidth/draw.attr("width");
		var y = (e.pageY - offsetTop)*viewBoxHeight/draw.attr("height");
		if(e.touches && e.touches[0]){
			x = (Number(e.touches[0].pageX) - offsetLeft)*viewBoxWidth/draw.attr("width");;
			y = (Number(e.touches[0].pageY) - offsetTop)*viewBoxHeight/draw.attr("height");
		}
		var htmlX = (e.pageX - offsetLeft);
		var htmlY = (e.pageY - offsetTop);
        switch(tool.shape){
            case "text":
				currentObj = $('<div class="textArea"><textarea style="-webkit-user-select:text !important"></textarea></div>');
                var cssJson = {
					"border-color": tool.stroke,
					color: tool.stroke,
                    left:htmlX,
                    top: htmlY
                }
				currentObj
				.css(cssJson)
				.attr("id", getUniqueId());
                $("#drawsvgContainer").append(currentObj);
				currentObj.children("textarea").focus();
				socket.emit("protobuf", makeActionReq({
					bordIndex: Number(indexPage),
					shapId: currentObj.attr("id"),
					oprate: 9,
					penColor: tool.stroke,
					penDegree: tool.strokeWidth,
					shap: "text",
					startX: x,
					startY:  y,
					content: "",
					fontsize: 13*viewBoxHeight/draw.attr("height")
				}))
				currentObj.children("textarea").keyup(function(e){
					// console.log($(e.target),e.target.value,e.target.scrollLeft);
					// $(this).css({
					// 			"width":$(e.target)[0].textLength*8+"px",
					// 			height: e.target.scrollTop + e.target.offsetHeight + "px"
					// 		});

					if(e.target.scrollLeft > 0){
						// console.log($(e.target),e.target.value,e.target.scrollLeft);
						$(this).css({
							"width":e.target.scrollLeft + e.target.offsetWidth + 7 +"px",
							height: e.target.scrollTop + e.target.offsetHeight + "px"
						});
					}
					if(e.target.scrollTop > 0){
						$(this).css({
							"width":e.target.scrollLeft + e.target.offsetWidth +"px",
							height: e.target.scrollTop + e.target.offsetHeight + "px"
						});
					}
					
					// if(origWidth == e.target.offsetWidth ){
					// 	origWidth = e.target.offsetWidth;
					// 	currentObj.children("textarea").css({
					// 		"width":e.target.scrollLeft + e.target.offsetWidth +"px",
					// 		height: e.target.scrollTop + e.target.offsetHeight + "px"
					// 	});
					// }
					// else{//吃饭
					// 	origWidth = e.target.offsetWidth;
					// 	currentObj.children("textarea").css({
					// 		"width":e.target.scrollLeft + e.target.offsetWidth + 7 +"px",
					// 		height: e.target.scrollTop + e.target.offsetHeight + "px"
					// 	});
					// }

					// e.target.width = e.target.scrollLeft + e.target.offsetWidth + "px";
					socket.emit("protobuf", makeActionReq({
                        bordIndex: Number(indexPage),
						shapId: $(this).parent().attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "text",
						startX: x,
						startY:  y,
						content: e.target.value,
						fontsize: 13*viewBoxHeight/draw.attr("height")
					}))
				});
				currentObj.children("textarea").blur(function(e){
					var content = e.target.value;
					var id = $(this).parent().attr("id");
					$(".textArea").remove();
					// if(content){
						currentObj = draw
						.group()
						.text(content)
						.attr({
							stroke: tool.stroke,
							id: id,
							fill: tool.stroke,
							x:	x,
							y: y
						})
						.font({
							family:   'Helvetica',
							size:     13*viewBoxHeight/draw.attr("height")
						});
						socket.emit("protobuf", makeActionReq({
							bordIndex: Number(indexPage),
							shapId: currentObj.attr("id"),
							oprate: 11,            //绘制结束 draw_end
							penColor: tool.stroke,
							penDegree: tool.strokeWidth,
							shap: currentObj.node.tagName,
						}), function(e){
							_deleteCacheMsg(formEMFrame(e));
							console.log("end ack function:", formEMFrame(e));
						});
						currentObj.off("mousedown").on("mousedown", _moveElementEvent);
						currentObj.off("touchstart").on("touchstart", _moveElementEvent);
					// }
				})
                break;
        }
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
				case "text":
					return;
 					break;
				case "rect":
					currentObj = draw.group()
					.rect()
					// .selectize()
					.attr(option)
					.move(x, y);

					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 9,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
                        shap: "rect",
                        bordIndex: Number(indexPage)
					}))
					break;
				case "circle":
					currentObj = draw.group()
					.ellipse()
					.attr(option)
					.move(x, y);
					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 9,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
                        shap: "ellipse",
                        bordIndex: Number(indexPage)
					}))
					break;
				case "pen":
					currentObj = draw.group().group()
					.path('M'+ parseInt(x) +' ' + parseInt(y))
					.attr(option);
					socket.emit("protobuf", makeActionReq({
						shapId: currentObj.attr("id"),
						oprate: 9,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						bordIndex: Number(indexPage),
						shap: "path",
						path:'M'+ parseInt(x) +' ' + parseInt(y)
					}))
					break;
				case "eraser":
					isEraser = true;
					return;
			}
			draw.on("mousemove", _mousedownEvtMove);
			draw.on("touchmove", _mousedownEvtMove);
		}
	}

	function throttle(delay, fn, me){
		var isVaile = true;
		var isLast = false;
		var timer;
		return function(){
			isLast = true;
			var args = arguments;
			var fn = fn || arguments[0]
			console.log(11111,isVaile);
			if(isVaile){
				console.log(2222,delay);
				fn.apply(me, args);
				isVaile = false;
				isLast = false;
				console.log(555555,isVaile);
				setTimeout(function(){
					console.log(444,delay);
					isVaile = true;
				},delay)
			}
			if(isLast){
				console.log(333333);
				clearTimeout(timer);
				timer = setTimeout(function(){
					fn.apply(me, args);
				}, 2*delay)
			}
		}
	}

	// var test = throttle(100);

	var _mousedownEvtMove = function(e){
		e.stopPropagation();
		// console.log('move');
		var x = (e.pageX - offsetLeft)*viewBoxWidth/draw.attr("width");
		var y = (e.pageY - offsetTop)*viewBoxHeight/draw.attr("height");
		if(e.touches && e.touches[0]){
			x = (Number(e.touches[0].pageX) - offsetLeft)*viewBoxWidth/draw.attr("width");
			y = (Number(e.touches[0].pageY) - offsetTop)*viewBoxHeight/draw.attr("height");
		}
		if(currentObj){
			switch(tool.shape){
                case "text":
					break;
				case "rect":
					currentObj
					.move(Math.min(currentObjData.initX, x), Math.min(currentObjData.initY, y))
					.size(Math.max(Math.abs(currentObjData.initX - x),0.1),  Math.max(Math.abs(currentObjData.initY - y),0.1))
					socket.emit("protobuf", makeActionReq({
                        bordIndex: Number(indexPage),
						shapId: currentObj.attr("id"),
						oprate: 10,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: "rect",
						startX: currentObjData.initX,
						startY: currentObjData.initY,
						endX: x,
                        endY: y,
					}))
					break;
				case "circle":
					currentObj
					.size(Math.max(Math.abs(currentObjData.initX - x),0.1),  Math.max(Math.abs(currentObjData.initY - y),0.1))
					.move(Math.min(currentObjData.initX, x), Math.min(currentObjData.initY, y))

					socket.emit("protobuf", makeActionReq({
                        bordIndex: Number(indexPage),
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
					var pathNew = pathOld + "L" + parseInt(x)+ " " + parseInt(y);
					currentObj && currentObj.plot(pathNew);
					pathStr += "L" + parseInt(x)+ " " + parseInt(y);
					// var send = function(){
					// 	pathStr && currentObj && socket.emit("protobuf", makeActionReq({
					// 		bordIndex: Number(indexPage),
					// 		shapId: currentObj.attr("id"),
					// 		oprate: 10,
					// 		penColor: tool.stroke,
					// 		penDegree: tool.strokeWidth,
					// 		shap: "path",
					// 		incrementPath: pathStr
					// 	}));
					// 	pathStr = "";
					// }
					// test(send,e);
					setInterval(function(){
						pathStr && currentObj && socket.emit("protobuf", makeActionReq({
							bordIndex: Number(indexPage),
							shapId: currentObj.attr("id"),
							oprate: 10,
							penColor: tool.stroke,
							penDegree: tool.strokeWidth,
							shap: "path",
							incrementPath: pathStr
						}));
						pathStr = "";
					}, 50)
					// currentObj && socket.emit("protobuf", makeActionReq({
					// 	bordIndex: Number(indexPage),
					// 	shapId: currentObj.attr("id"),
					// 	oprate: 10,
					// 	penColor: tool.stroke,
					// 	penDegree: tool.strokeWidth,
					// 	shap: "path",
					// 	incrementPath: "L" + parseInt(x)+ " " + parseInt(y)
					// }));
					break;
				case "select":
					var toX = initPostion.x + (x - currentObjData.initX);
					var toY= initPostion.y + (y - currentObjData.initY);
					var opt = {
						bordIndex: Number(indexPage),
						shapId: currentObj.attr("id"),
						oprate: 31,
						penColor: tool.stroke,
						penDegree: tool.strokeWidth,
						shap: currentObj.node.tagName,
						startX: toX,
						startY: toY
					}
					if(currentObj.node.tagName == "path"){
						currentObj.parent().move(toX, toY);
						opt.path = currentObj.attr("d");
					}
					else if(currentObj.node.tagName == "text"){
						currentObj.attr({
							x: toX,
							y: toY
						});
						opt.content = currentObj.node.textContent;
						opt.endX = toX + (currentObj.attr("width") ? currentObj.attr("width") : 2*currentObj.attr("rx"));
						opt.endY = toY + (currentObj.attr("height") ? currentObj.attr("height") : 2*currentObj.attr("ry"));
					}
					else{
						currentObj.move(toX, toY);
						opt.endX = toX + (currentObj.attr("width") ? currentObj.attr("width") : 2*currentObj.attr("rx"));
						opt.endY = toY + (currentObj.attr("height") ? currentObj.attr("height") : 2*currentObj.attr("ry"));
					}
					socket.emit("protobuf", makeActionReq(opt));
					break;
			}
		}
	}

	var _mousedownEvtEnd = function(e){ 
		e.stopPropagation();
		if(currentObj){
			if(pathStr){
				currentObj && socket.emit("protobuf", makeActionReq({
					bordIndex: Number(indexPage),
					shapId: currentObj.attr("id"),
					oprate: 10,
					penColor: tool.stroke,
					penDegree: tool.strokeWidth,
					shap: "path",
					incrementPath: pathStr
				}));
				pathStr = "";
			}
			// currentObj.off("mouseout");
			currentObj.off("mouseover").on("mouseover", function(){   //mouseout有时不触发
				__deleteElement(this);
			});
			//touchmove不能实现****
			currentObj.on("touchmove", function(e){    //***** */移动端事件不好处理
				e.preventDefault();
			});
			// currentObj.off("click");
			currentObj.off("click").on("click", function(){   //***** */是否可以移动到_moveElementEvent里
				__deleteElement(this,true);
			});
			currentObj.off("mousedown").on("mousedown", _moveElementEvent);
			currentObj.off("touchstart").on("touchstart", _moveElementEvent);
			currentObj.node && socket.emit("protobuf", makeActionReq({
                bordIndex: Number(indexPage),
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
		isEraser = false;
	}

	var __deleteElement = function(self,isClick){
		if(tool.shape == "eraser" && (isEraser || isClick)){
			socket.emit("protobuf", makeActionReq({
					bordIndex: Number(indexPage),
					shapId: self.attr("id"),
					oprate: 20,      //删除  remove
					shap: self.node.tagName
				}), function(e){
				_deleteCacheMsg(formEMFrame(e));
				console.log("delete ack function:", formEMFrame(e));
			})
		}
	}
	
	var _moveElementEvent = function(e){
		// e.stopPropagation();
		var pathX = this.parent().attr("transform") && this.parent().attr("transform").split(",")[4];
		var psthY = this.parent().attr("transform") && this.parent().attr("transform").split(",")[5].split(")")[0];
		initPostion.x = this.attr("x") || (this.attr("cx") - this.attr("rx")) || parseFloat(pathX) || 0;
		initPostion.y = this.attr("y") || (this.attr("cy") - this.attr("ry")) || parseFloat(psthY) || 0;
		var x = (e.pageX - offsetLeft)*viewBoxWidth/draw.attr("width");
		var y = (e.pageY - offsetTop)*viewBoxHeight/draw.attr("height");
		if(e.touches && e.touches[0]){
			x = (Number(e.touches[0].pageX) - offsetLeft)*viewBoxWidth/draw.attr("width");
			y = (Number(e.touches[0].pageY) - offsetTop)*viewBoxHeight/draw.attr("height");
		}
		currentObjData.initX = x;
		currentObjData.initY = y;
		if(tool.shape == "select"){
			socket.emit("protobuf", makeActionReq({
				bordIndex: Number(indexPage),
				shapId: this.attr("id"),
				oprate: 30,
				penColor: tool.stroke,
				penDegree: tool.strokeWidth,
				shap: this.node.tagName,
			}));
			currentObj = this;
		}
		// else if(tool.shape == "eraser" && (isEraser || isClick)){
		// 	socket.emit("protobuf", makeActionReq({
		// 			bordIndex: Number(indexPage),
		// 			shapId: self.attr("id"),
		// 			oprate: 20,      //删除  remove
		// 			shap: self.node.tagName
		// 		}), function(e){
		// 		_deleteCacheMsg(formEMFrame(e));
		// 		console.log("delete ack function:", formEMFrame(e));
		// 	})
		// }
	}


	var _uploadFile = function(e, is, id){
		var url = '';
		var orgName = appkey.split("#")[0];
		var appName = appkey.split("#")[1];
		if(is){
			url = headerUrlRest + "/"+ orgName +"/"+ appName +"/whiteboards/upload/dynamic/" + userId;
		}
		else{
			url = headerUrlRest +  "/"+ orgName +"/"+ appName +"/whiteboards/upload/" + userId;
		}
		// var url = headerUrlRest + "/222/111/whiteboards/upload/" + userId;
		var fileObj = document.getElementById(id);
		var file = fileObj.files[0];
		if(!file){
			return false;
		}
		var form = new FormData(); // FormData 对象
		form.append("file", file); // 文件对象
		fileObj.value = "";

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
		function uploadComplete(e){
			$(".loading").css("display","none");
			$(".content-a-upload").css("display","flex");
			_alert('上传成功，点击<img src='+imgUrl+'></img>进行页面切换');
		}
		function uploadFailed(e){
			_alert("上传失败，请重新上传");
		}
		function progressFunction(e){
			$(".loading").css("display","block");
			$(".content-a-upload").css("display","none")
		}
	}

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
    
    var _clearView = function(){
		$("g").remove();
		currentObj = null;
		// var url = SVG.get("imgBackgroud") && SVG.get("imgBackgroud").attr("href");
		// draw.clear();
	}

	var _deleteCacheMsg = function(EMFrame){
        var msgId = getDatByPath(EMFrame, "ackMsg.msgId");
		msgId && messageCache.deleteMsg(msgId);
	}

	function _alert(str,callback){
		$(".messageItem").html(str).css({display:"inline-block"});
		setTimeout(function(){
			$(".messageItem").css({display:"none"});
			callback && callback();
			// window.opener=null;
			// window.open('','_self');
			// window.close();
		}, 3000)
	}
}

export default initMainView;