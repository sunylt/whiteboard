import protobuf from 'protobufjs';
import getAll from '../all';
var all = getAll();
var root = protobuf.Root.fromJSON(all);

import {GetQueryString, getUniqueId} from '../utils';
import messageCache from '../messageCache';
// var roomId = GetQueryString("roomId");
var userId = GetQueryString("userId");
// var token = GetQueryString("token");

var makeMediaReq = function(option){
	var emptyMessage = [];
	var MediaReq = root.lookup("protobuf.MediaReq");
	var MediaReqMessage = MediaReq.decode(emptyMessage);
	
	// SheetReqMessage.index = option.index;  //*****
    MediaReqMessage.mediaButton = option.mediaButton;
	MediaReqMessage.mediaId = option.mediaId;
	MediaReqMessage.playTime = option.playTime;

	var EMRequest = root.lookup("protobuf.EMRequest");
	var EMRequestMessage = EMRequest.decode(emptyMessage);
	var msgId = getUniqueId(userId);
	EMRequestMessage.proType = 70;
	EMRequestMessage.msgId = msgId + "-1";
	// EMRequestMessage.userId = GetQueryString("userId") || "0TBJKPLWQQ00#0";
	EMRequestMessage.userId = option.userId || userId;

	EMRequestMessage.mediaReq = MediaReqMessage;

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
	messageCache.setMsg(msgId + "-1", EMFrameMessageCache.buffer.slice(EMFrameMessageCache.byteOffset, EMFrameMessageCache.byteOffset + EMFrameMessageCache.byteLength));

	return msgBuffer;
}

export default makeMediaReq