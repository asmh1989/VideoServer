var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function(web) {
    // define schema

    var videos = new Schema({
        //封面链接
        img : String,
        //视频名称
        name : String,
        //视频链接
        href : String,
        //视频分类名称
        cat_name : String,
        //视频分类链接
        cat_href : String,
        //评分
        score:{type:Number, default:5.0}
    });

    mongoose.model(web+'videos', videos);
};