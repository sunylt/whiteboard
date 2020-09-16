import $ from 'jquery';
import {getDatByPath, getParams} from '../utils';
import makeMediaReq from '../handleRequst/makeMediaReq';
import formEMFrame from '../handleResponse/formEMFrame';
import { _alert } from '../commentTool/alertMessage';

var isCreater = getParams("isCreater") == 'true'? true: false;
var canVideo = function(){
    console.log(1);
    if(!isCreater){
        return false;
    }
    console.log(2);
}
export function dispatcherMedia(formData, socket){
    var mediaUrl =  getDatByPath(formData, "emResponse.boardcastResponse.mediaUrl");
    var mediaId =  getDatByPath(formData, "emResponse.boardcastResponse.mediaId");
    var playTime = getDatByPath(formData, "emResponse.boardcastResponse.playTime");
    var errKey = false;
    var id = "id_"+mediaId;
    var video = $("#id_"+mediaId)[0];
    var lastTime = 0;
    
    if(mediaUrl && !$(".videoPlay").length){
        var controls = isCreater ? 'controls' : '';
        var muted = isCreater ? '' : 'muted';
        !isCreater && $(".volume").css("display","block");
        !isCreater && _alert("当前视频处于静音状态，可以点击右下角按钮打开视频声音。");
        var videoHtml = videoHtml = '<video class="videoPlay" '+ muted +' id='+id + ' '+ controls +' name="media"><source src="'+mediaUrl+'" type="video/mp4"></video>';
        $(".videoBody").empty();
        $(".videoBody").append(videoHtml);
        $(".videoContainer").css("margin","0px");
        video = $("#id_"+mediaId)[0];
        // video.load();
        if(/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)){
            video.load();
        }
        $(".deletVideo")[0].onclick = function(){ 
            isCreater ? socket.emit("protobuf", makeMediaReq({
                mediaButton: 1,
                mediaId: mediaId,
                // layTime:(video.currentTime).toString() || ""
            }), function(e){
                // console.log("media ack", formEMFrame(e));
            })
            : _alert("没有权限操作");
        }
        $(".volume").click(function(){
            if(video.muted){
                console.log(video.muted);
                $(this).addClass("selectMute");
                video.muted = false;
            }
            else{
                $(this).removeClass("selectMute");
                video.muted = true;
            }
        })
        video.onpause = function(e){
            if(errKey){
                return false
            }
            isCreater && socket.emit("protobuf", makeMediaReq({
                mediaButton: 3,
                mediaId: mediaId,
                playTime:(video.currentTime).toString() || ""
            }), function(e){
                // console.log("media ack", formEMFrame(e));
            })
        }
        video.onplay = function(e){
            if(errKey){
                return false
            }
            isCreater && socket.emit("protobuf", makeMediaReq({
                mediaButton: 2,
                mediaId: mediaId,
                playTime:(video.currentTime).toString() || ''
            }), function(e){
                // console.log("media ack", formEMFrame(e));
            })
        }
        // video.ontimeupdate = function(e){
        //     var current = video.currentTime;
        //     if(current - lastTime > 2) {
        //         video.currentTime = lastTime
        //         // errKey = true;
        //         // video.pause();
        //         // video.currentTime = e.target.currentTime;
        //         // video.play()
        //     } else {
        //         lastTime = current;
        //     }
        // }
    }
    var mediaButton =  getDatByPath(formData, "emResponse.boardcastResponse.mediaButton");
    
    switch(mediaButton){
        // case 0:
        //     break;
        case 1:
            $(".videoBody").empty();
            $(".videoContainer").css("margin","-150vw");
            break;
        case 2:
            setTimeout(function(){
                video.currentTime=parseFloat(playTime) || 0;
                console.log(playTime,'-----');
                console.log(parseFloat(playTime) || 0)
                console.log(video.currentTime);
                var videoPromise = video.play();
                console.log(video.currentTime);
                // video.volume = 0.5;
                // video.muted = false
                if(videoPromise){
                    videoPromise
                    .then(()=>{
                        console.log("播放啦");
                    })
                    .catch(function(err,e){
                        console.log("不能播放请手动点击-----",err);
                        errKey = true;
                        return null
                    })
                }
            },0)
            
            break;
        case 3:
            setTimeout(function(){
                if(video){
                    video.currentTime=parseFloat(playTime) || 0;
                }
                console.log(video,'----');
                if(video && video.pause()){
                    video
                    .pause()
                    .then(()=>{
                        console.log("暂停啦");
                    })
                    .catch(function(err){
                        errKey = true;
                        console.log("暂停错误");
                        return null
                    })
                }
            },0)
            break;
        case 6:
            socket.emit("protobuf", makeMediaReq({
                mediaButton: video.paused ? 3: 2,
                mediaId: mediaId,
                playTime:(video.currentTime).toString()
            }), function(e){
                // console.log("media ack", formEMFrame(e));
            })
            break;
    }
}