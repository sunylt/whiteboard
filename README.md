


##说明
白板（Easemob-WhiteBoard）服务端基于sockt.io，页面基于svg.js开发，所以兼容性参考上述两项即可。SDK提供了创建白板、加入白板、销毁白板三个API。  创建白板后会返回一个白板地址链接，客户端通过ifram 或者 webview方式集成。
##集成
	1.通过<script>静态资源的方式引入白板sdk
	    - <script type="text/javascript" src="*/whiteboardsSdk.js"></script>
	2.初始化
	    - var WDSdk = new whiteBoards({
			restApi: "http://turn2.easemob.com:8031",
			appKey: "222#111"
		});
	3.API
		- a.创建白板 (WDSdk.create)
			WDSdk.create({
				userName: userName,     //im用户名
				roomName: roomName,     //im用户名
				token: "1233",          //im登陆后token
				suc: function(res){
					console.log(res);
					window.location = res.whiteBoardUrl;     //返回的白板地址链接及一些其他白板房间参数
				},
				error: function(err){
					console.log("err", err);
				}
			});

		- b.加入白板 
			加入白板2中方式分别是：
			+ 1.joinByRoomId 通过已经创建的房间ID加入；
			+ 2.joinByRoomName 通过已经创建的房间名称加入；

			//通过房间ID加入
			WDSdk.joinByRoomId({
				userName: userName,    //im用户名
				roomId: roomId,        //im用户名
				token: "1233",         //im登陆后token
				suc: function(res){
					window.location = res.whiteBoardUrl;
				},
				error: function(err){
					console.log("err", err);
				}
			});
			//通过房间名加入
			WDSdk.joinByRoomName({
				userName: userName,
				roomName: roomName,
				token: "1233",
				suc: function(res){
					console.log(res);
					window.location = res.whiteBoardUrl;  //同joinByRoomId返回
				},
				error: function(err){
					console.log("err", err);
				}
			});
		- c.销毁白板
			WDSdk.destroy({
				roomId: roomId,
				token: "1233",
				suc: function(res){
					console.log(res);
				},
				error: function(err){
					console.log("err", err);
				}
			});


