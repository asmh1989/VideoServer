var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function(web) {
  // define schema

  var videos = new Schema({
    img : String,
    alt : String,
    href : String,
    category : String
  });

  mongoose.model(web+'videos', videos);
};