var messageCache = {
    cacheMsg: {}
}
// messageCache.cacheMsg = {};
messageCache.setMsg = function(msgId, msg){
    this.cacheMsg[msgId] = msg;
}

messageCache.deleteMsg = function(msgId){
    delete this.cacheMsg[msgId];
}
messageCache.getMsgList = function(){
    return this.cacheMsg
}
export default messageCache;
