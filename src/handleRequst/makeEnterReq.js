import protobuf from 'protobufjs';
import getAll from '../all';
var all = getAll();
var root = protobuf.Root.fromJSON(all);

import {GetQueryString, getUniqueId} from '../utils';
import messageCache from '../messageCache';
var roomId = GetQueryString("roomId");
var userId = GetQueryString("userId");
var token = GetQueryString("token");

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

export default makeEnterReq;