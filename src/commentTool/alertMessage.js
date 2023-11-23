import $ from 'jquery';
export function _alert(str,callback){
    $(".messageItem").html(str).css({display:"inline-block"});
    setTimeout(function(){
        $(".messageItem").css({display:"none"});
        callback && callback();
    }, 3000)
}