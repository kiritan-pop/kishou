//モジュールを拡張機能として読み込む
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var config = require('./config');
var fs = require("fs");
var server = http.createServer();//httpのサーバを作成するぞー、という関数
var io = require("socket.io").listen(server);
var user_cnt = 0

server.on('request', function (req, res) {//httpリクエストがあった(=アクセスされた)時に呼ばれる  
    var urlInfo = url.parse(req.url, true);
    if (req.method === "GET" && urlInfo.pathname === "/websub") {
        if (urlInfo.query['hub.mode'] === "subscribe" || urlInfo.query['hub.mode'] === "unsubscribe"){
            if (urlInfo.query['hub.verify_token'] === config.verifyToken){
                console.log("■ 購読確認処理");
                // リクエストに含まれるチャレンジコードをそのまま返せばいいらしい
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(urlInfo.query['hub.challenge']);
                res.end();
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.write('Bad Request(invalid verify)');
                res.end();
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.write('Bad Request');
            res.end();
        }
    } else if (req.method === "POST" && urlInfo.pathname === "/websub") {
        console.log("■ 更新情報受信");
        var data = '';

        //POSTデータを受けとる
        req.on('data', function (chunk) { data += chunk })
        req.on('end', function () {
            // websocketでそのまま配信するだけ
            io.emit("msg", data);
            // 一応ファイルにも書き込んでおくこととす
            fs.appendFile("out.txt", data + '\n' , (err, data) => {
                if(err) console.log(err);
                else console.log('write end');
            });
            // 受け取り結果は以下のコードで返すらしい
            res.writeHead(204, { 'Content-Type': 'text/plain' });
            res.end();
        })
    }
});

io.on('connection', function (socket) {
    user_cnt += 1;
    console.log(`socket.io:user connected (user:${user_cnt})`);
    socket.on('disconnect', function(){
        user_cnt -= 1;
        console.log(`socket.io:user disconnected (user:${user_cnt})`);
    });
  });
server.listen(config.port);

console.log(`Server runnning at ${config.port}`);
