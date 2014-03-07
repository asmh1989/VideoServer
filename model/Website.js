var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function() {
  // define schema

  var wwwSchema = new Schema({
    name : String,
    address : String,
    category : [{
    	name:String,
    	href:String,
      update:{type: Date, default: Date.now}
    }],
    date :{type: Date, default: Date.now}
  });

  mongoose.model('website', wwwSchema);
};