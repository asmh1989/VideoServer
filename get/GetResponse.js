var url = require('url');
var db = require('../model/db.js');

function resEnd(res, str){
    res.end(JSON.stringify(str));
}

module.exports = function(req, res){
    var result;

    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    var pathname = url.parse(req.url).pathname;

    if(pathname === '/sun'){
        var query = url.parse(req.url, true).query;
        var website = query.website;
        var type = query.type;

        console.log('website='+website+' type='+type+' category='+query.category);
        //获取列表
        if(website) {
            if(!db.checkWebsiteExist(website)){
                resEnd(res, {ERR:website+'该网站还未索引'});
            }
            if(!type){
                db.getCategory(website, function(r){
//                var m = {r};
                    resEnd(res, {category:r});
                });
            }
            else if(website && type){
                var href = query.href;
                switch (type){
                    //0: 获取最新视频数据
                    case '0':
                        var cat = query.category;
                        db.getLatest(website, cat, function(r){
                            resEnd(res, {videos:r});
                        });
                        return;
                    //1: 获取分类适配, 需要href
                    case '1':
//                        resEnd(res, {SORRY:'等待完善'});
                        var cat = query.category;
                        var start = query.start;
                        if(!start){
                           start = 0;
                        }
                        var myDate = new Date();
                        console.log(myDate.toString()+'=====抓取分类视频 category = '+cat+' start='+start);

                        db.getCategoryVideos(website, cat, start, function(r){
                            // for(var i = 0; i< r.length; i++){
                            //     r[i]._id = undefined;
                            // }
                            resEnd(res, {videos:r});
                        })
                        return;
                    //2: 获取视频详细信息, 需要href
                    case '2':
                        db.getVideoDetail(website, href, function(r){
                            resEnd(res, {videodetail:r});
                        });
                        return;
                    default:
                        resEnd(res, {ERR:'no support'});
                        return;
                }
            }
        }else {
            result={ERR:'请指定网站'};
            resEnd(res, result);
        }
    }

    resEnd(res, {ERR:'no website'});
}