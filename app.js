
/**
 * Module dependencies.
 */

var http = require('http');
var server = http.createServer();
var db = require('./model/db.js');
var getResponse = require('./get/GetResponse.js');

var querystring = require('querystring');


var postResponse = function(req, res) {
    var info ='';
    req.addListener('data', function(chunk){
        info += chunk;
    })
        .addListener('end', function(){
            info = querystring.parse(info);
            res.setHeader('content-type','text/html; charset=UTF-8');//响应编码
            res.end('Hello World POST ' + info.name,'utf8');
        })
}

var requestFunction = function (req, res){
    req.setEncoding('utf8');//请求编码

    if (req.method == 'POST'){
        return postResponse(req, res);
    }

    return getResponse(req, res);
}

server.on('request',requestFunction);
server.listen(15667);

console.log('Server running at http://localhost:15668/');