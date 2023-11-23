import $ from 'jquery';
import {getDatByPath, GetQueryString, getUniqueId, getParams} from '../utils';
import imgUrl from '../../icon/page.png'
import { _alert } from '../commentTool/alertMessage';
var appkey = getParams("appKey");
var headerUrlRest = GetQueryString("domainName");
var userId = GetQueryString("userId");
export function _uploadFile(e, is, id){
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
        if(this.readyState == 4 && this.status == 200){
            _alert('上传成功，点击<img src='+imgUrl+'></img>进行页面切换');
        }
        else{
            _alert("上传失败，请重新上传");
        }
    }
    function uploadFailed(e){
        $(".loading").css("display","none");
        $(".content-a-upload").css("display","flex");
        _alert("上传失败，请重新上传");
    }
    function progressFunction(e){
        $(".loading").css("display","block");
        $(".content-a-upload").css("display","none")
    }
}