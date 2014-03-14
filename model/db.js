var mongoose = require('mongoose');
var settings = require('../config/Settings.js');


mongoose.connect('mongodb://'+settings.db, function(err){
    if(err) throw err;
    console.log("connect ...."+settings.db);
    DB.getCategory();
});

var latestModels = [];
var videoDetailModels = [];
var categoryVideos = [];

require('./Website.js')();
var websiteModel =  mongoose.model('website');

//缓存所有网站的分类
var categoryCache = [];
var latestCache = [];
var categoryVideoCache = [];

function findInCategoryVideoCache(website, href){
    for(var i =0; i < categoryVideoCache.length; i++){
        var data = categoryVideoCache[i];
        if(data.website === website && data.category === href){
            return i;
        }
    }
    return -1;
}

function categoryVideoCacheContains(datas, href){
    for(var i = 0; i < datas.length; i++){
        if(datas[i].href === href){
            return datas[i]._id;
        }
    }
    return '';
}

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
//                    console.log('getVideoDetail: found '+doc);
                    callback(doc);
                }
            });
        }

    },

    /**
     * 获取分类视频列表 默认load20条数据
     * @param website   该视频分类所属的网站
     * @param href      该视频分类对应的url
     * @param start     从这个url后面的列表
     * @param callback  回调
     *
     * @return ERR:
     * 0:指定url错误,分类视频需要用category
     * 1:没有更多的分类视频了
     * 2:当前指定的开始查询位置有误, 数据库中没有该视频
     */
    getCategoryVideos: function(website, href, start, callback){

        if(!href){
            callback({ERR:'获取分类的视频, 用category=??', ID:0});
            return;
        }


        var categoryVideo;
        if(categoryVideos.length > 0){
            for(var i = 0; i < categoryVideos.length; i++){
                if(categoryVideos[i].name === website){
                    categoryVideo = categoryVideos[i].schema;
                }
            }
        }

        if(!categoryVideo){
            require('./VideosSchema.js')(website);
            categoryVideo  = mongoose.model(website+'videos');
            categoryVideos.push({
                name:website,
                schema:categoryVideo
            });
        }

        function findResult (err, doc){
//            console.log('findResult doc = '+doc);
            if(!doc ||  doc.length == 0){
                callback({ERR:'该分类视频下二十条数据似乎不存在,似乎不存在', ID:1});
            } else {
                var inCache = findInCategoryVideoCache(website, href);
                if( inCache < 0){
                    var m = {};
                    m.website = website;
                    m.category = href;
                    m.datas = [];
                    for(var i = 0; i < doc.length; i++){
                        var n = {};
                        n.href = doc[i].href;
                        n._id = doc[i]._id;
                        m.datas.push(n);
                    }
                    categoryVideoCache.push(m);
                }
                callback(doc);

            }
        }

        if(start != 0){
            var where_id = '';
            var i = findInCategoryVideoCache(website, href);
            if(i >= 0){
                where_id = categoryVideoCacheContains(categoryVideoCache[i].datas, start);
            }

//            console.log('find where_id = '+where_id);

            if(where_id === ''){
                categoryVideo.findOne({href:start}, 'href', '', function(err, doc){
                    if(!doc ||  doc.length == 0){
                        callback({ERR:'出现查询id错误...', ID:2});
                    } else {
//                        console.log('find start href = '+doc.href+' : '+doc._id);
                        var inCache = findInCategoryVideoCache(website, href);

                        if( inCache < 0){
                            var m = {};
                            m.website = website;
                            m.category = href;
                            m.datas = [];
                            var n = {};
                            n.href = doc.href;
                            n._id = doc._id;
                            m.datas.push(n);
                            categoryVideoCache.push(m);
                        } else {
                            var n = {};
                            n.href = doc.href;
                            n._id = doc._id;
                            categoryVideoCache[inCache].datas.push(n);
                        }

                        categoryVideo.find({cat_href:href, $where:'this._id < ObjectId(\''+doc._id+'\')'})
                            .sort({'_id':-1}).limit(20).select('img name href')
                            .exec(findResult);

                    }
                })
            } else {
//                console.log('find id where_id = '+where_id);
                categoryVideo.find({cat_href:href, $where:'this._id < ObjectId(\''+where_id+'\')'})
                    .sort({'_id':-1}).limit(20).select('img name href')
                    .exec(findResult);
            }
            return;
        }

        categoryVideo.find({cat_href:href})
            .sort({'_id':-1}).limit(20).select('img name href')
            .exec(findResult);
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
