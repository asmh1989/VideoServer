var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function(web) {
    // define schema

    var video = new Schema({
        img : String,
        actor: String,
        name : String,
        category : String,
        href: String,
        plays: {Type: Number, default: 0},
        origin: String,
        language: String,
        year: String,
        uploadtime: String,
        director: String,
        qvod:[{
            name:String,
            url:String
        }],
        about:String
    });

    mongoose.model(web+'videoDetail', video);
};