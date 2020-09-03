import $ from 'jquery';
import {getDatByPath, getParams} from '../utils';
import makeMediaReq from '../handleRequst/makeMediaReq';
import formEMFrame from '../handleResponse/formEMFrame';

var isCreater = getParams("isCreater") == 'true'? true: false;
export function dispatcherMedia(formData, socket){
    var mediaUrl =  getDatByPath(formData, "emResponse.boardcastResponse.mediaUrl");
    var mediaId =  getDatByPath(formData, "emResponse.boardcastResponse.mediaId");
    var playTime = getDatByPath(formData, "emResponse.boardcastResponse.playTime");
    var id = "id_"+mediaId;
    var video = $("#id_"+mediaId)[0];
    if(mediaUrl && !$(".videoPlay").length){
        var controls = isCreater? 'controls' : ''
        var videoHtml = '<video class="videoPlay" id='+id + ' preload="metadata" '+ controls +' controlslist="nodownload nofullscreen" src="'+mediaUrl+'" loop>您的浏览器不支持 video 标签。</video>';
        $(".videoBody").empty();
        $(".videoBody").append(videoHtml);
        $(".videoContainer").css("margin","0px");
        if(/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)){
            video.load();
        }
        video = $("#id_"+mediaId)[0];
        $(".deletVideo")[0].onclick = function(){ 
            socket.emit("protobuf", makeMediaReq({
                mediaButton: 1,
                mediaId: mediaId,
                layTime:(video.currentTime).toString() || ""
            }), function(e){
                console.log("media ack", formEMFrame(e));
            })
        }
        video.onpause = function(e){
            socket.emit("protobuf", makeMediaReq({
                mediaButton: 3,
                mediaId: mediaId,
                playTime:(video.currentTime).toString() || ""
            }), function(e){
                console.log("media ack", formEMFrame(e));
            })
            console.log(e, "onpause");
        }
        video.onplay = function(e){
            socket.emit("protobuf", makeMediaReq({
                mediaButton: 2,
                mediaId: mediaId,
                playTime:(video.currentTime).toString() || ''
            }), function(e){
                console.log("media ack", formEMFrame(e));
            })
            console.log("onplay");
        }
    }
    var mediaButton =  getDatByPath(formData, "emResponse.boardcastResponse.mediaButton");
    // var video = $("#id_"+mediaId)[0];
    
    switch(mediaButton){
        // case 0:
        //     break;
        case 1:
            $(".videoBody").empty();
            $(".videoContainer").css("margin","-150vw");
            break;
        case 2:
            video.currentTime=parseFloat(playTime) || 0;
            var videoPromise = video.play()
            if(videoPromise){
                videoPromise
                .then(()=>{
                    console.log("播放啦");
                })
                .catch(function(err,e){
                    console.log("不能播放手动点击");
                    console.log(err,e);
                    alert("设置 Safari浏览器 -> 此网站设置 ->自动播放 -> 允许全部自动播放");
                    return null
                })

            }
            break;
        case 3:
            video.currentTime=parseFloat(playTime) || 0;
            if(video && video.pause()){
                video
                .pause()
                .then(()=>{
                    console.log("播放啦");
                })
                .catch(function(err){
                    console.log("不能播放手动点击");
                    return null
                })
            }
            break;
        // case 5:
            
        //     video.currentTime=parseFloat(playTime);
        //     video.play();
        //     break;
        case 6:
            socket.emit("protobuf", makeMediaReq({
                mediaButton: video.paused ? 3: 2,
                mediaId: mediaId,
                playTime:(video.currentTime).toString()
            }), function(e){
                console.log("media ack", formEMFrame(e));
            })
            break;
    }
}