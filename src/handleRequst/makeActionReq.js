import protobuf from 'protobufjs';
import getAll from '../all';
var all = getAll();
var root = protobuf.Root.fromJSON(all);

import {GetQueryString, getUniqueId} from '../utils';
import messageCache from '../messageCache';
var roomId = GetQueryString("roomId");
var userId = GetQueryString("userId");
var token = GetQueryString("token");

var makeActionReq = function(option){
	var emptyMessage = [];
	if(option.oprate == 9 || option.oprate == 10 || option.oprate == 11 || option.oprate == 30 || option.oprate == 31){
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
		PolylineMessage.start = CoordinatesMessageStart;
		PolylineMessage.end = CoordinatesMessageEnd;
		PolylineMessage.incrementPath = option.incrementPath;

		//文字
		var TextBox = root.lookup("protobuf.TextBox");
		var TextBoxMessage = TextBox.decode(emptyMessage);
		TextBoxMessage.content = option.content;
		TextBoxMessage.start = CoordinatesMessageStart;
		TextBoxMessage.fontsize = option.fontsize;
		


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
			case "text":
				GeometryMessage.model = 5;
				GeometryMessage.textBox = TextBoxMessage;
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
			case "text":
				GeometryMessage.model = 5;
				break;
		}
	}
	// GeometryMessage.model = option.shap;    //画的图形 需要case

	var Action = root.lookup("protobuf.Action");
	var ActionMessage = Action.decode(emptyMessage);
	ActionMessage.bordIndex = option.bordIndex || 0;
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
		messageCache.setMsg(msgId + "-1", EMFrameMessageCache.buffer.slice(EMFrameMessageCache.byteOffset, EMFrameMessageCache.byteOffset + EMFrameMessageCache.byteLength));
	}
	return msgBuffer;
}
export default makeActionReq;