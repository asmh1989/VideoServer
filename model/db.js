var mongoose = require('mongoose');
var settings = require('../config/Settings.js');


mongoose.connect('mongodb://'+settings.db, function(err){
    if(err) throw err;
    console.log("connect ...."+settings.db);
    DB.getCategory();
});

var latestModels = [];
var videoDetailModels = [];

require('./Website.js')();
var websiteModel =  mongoose.model('website');

//缓存所有网站的分类
var categoryCache = [];
var latestCache = [];



var DB = {

    /**
     * 获取该网站分类
     * @param name 网站简称
     * @param callback 查询完后回调
     */
    getCategory:function(name, callback){

        var where = {};
        if(name && callback){
            where = {'name' : name};
            for(var i = 0; i < categoryCache.length; i++){
//                console.log('in cahce ='+categoryCache[i].name);
                if(categoryCache[i].name == name){
                    console.log('find  in cache '+name);
                    callback(categoryCache[i].category);
                    return;
                }
            }
        }

        websiteModel.find(where, 'name category' ,'' ,function (err, doc) {
            if (doc.length == 0) {
                console.log(name+' 分类没有查询到  ');
                if(callback){
                    callback({ERR:website+'该网站还未索引'});
                };
            } else {
                console.log("分类已经查询到");


                for(var i = 0; i < doc.length; i++){
                    var n = doc[i];
                    var m = {};
                    m.name = n.name;
                    m.category = [];
                    for(var j = 0; j < n.category.length; j++){
                        var p = n.category[j];
                        m.category.push({
                            name: p.name,
                            href: p.href
                        });
                    }
                    if(callback){
                        callback(m.category);
                    }
                    if(categoryCache.indexOf(m) == -1){
                        categoryCache.push(m);
                    }
                }
            }
        });
    },

    /**
     * 获取该网站的最新视频列表
     * @param website 网站简称
     * @param cat    视频类别
     * @param callback 完成回调
     */
    getLatest:function(website, cat, callback){
        var latestModel;
        if(latestModels.length > 0){
            for(var i = 0; i < latestModels.length; i++){
                if(latestModels[i].name === website){
                    latestModel = latestModels[i].schema;
                }
            }
        }

        if(!latestModel){
            require('./LatestSchema.js')(website);
            latestModel  = mongoose.model(website+'latest');
            latestModels.push({
                name:website,
                schema:latestModel
            });
        }
//        console.log('getLatest: website = '+website+' category = '+cat);

        if(!cat){
            callback({ERR:'获取最新列表需要指定分类, 用category=??'});
        } else{

            for(var i = 0; i < latestCache.length; i++){
//                console.log('in cahce ='+latestCache[i].name);
                if(latestCache[i].name == cat){
                    console.log('find in cache '+cat);
                    callback(latestCache[i].content);
                    return;
                }
            }

            var where = {name: cat};
            latestModel.findOne(where, 'name content', '', function(err, doc){
                if(doc == null){
                    callback({ERR:'该类别的最新视频,似乎不存在'});
                } else {
                    var result = [];
                    for(var i = 0; i < doc.content.length; i++){
                        var c = doc.content[i];
                        var m = {};
                        m.name = c.name;
                        m.href = c.href;
                        m.img = c.img;
                        result.push(m);
                    }

                    callback(result);

                    var latest = {
                        name:cat, content:result
                    }

                    if(latestCache.indexOf(latest) == -1){
                        latestCache.push(latest);
                    }
                }
            });
        }
    },


    /**
     * 获取一个视频内容详情
     * @param datas 视频信息
     * @param website 所属网站
     */
    getVideoDetail:function(website, href, callback){
        var videoDetailModel;
        if(videoDetailModels.length > 0){
            for(var i = 0; i < videoDetailModels.length; i++){
                if(videoDetailModels[i].name === website){
                    videoDetailModel = videoDetailModels[i].schema;
                }
            }
        }

        if(!videoDetailModel){
            require('./OneVideoSchema.js')(website);
            videoDetailModel  = mongoose.model(website+'videoDetail');
            videoDetailModels.push({
                name:website,
                schema:videoDetailModel
            });
        }

        if(!href){
            callback({ERR:'获取最新列表需要指定连接, href=??'});
        } else{

            var where = {href: href};
            videoDetailModel.findOne(where, function(err, doc){
                if(doc == null){
                    callback({ERR:'该视频的详情,似乎不存在'});
                } else {
                    console.log('getVideoDetail: found '+doc);
                    callback(doc);
                }
            });
        }

    },

    checkWebsiteExist: function (website){
        for(var i = 0; i < categoryCache.length; i++){
            if(categoryCache[i].name === website){
                return true;
            }
        }
        return false;
    }
}

module.exports = DB;
