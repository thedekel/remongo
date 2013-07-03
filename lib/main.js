var mongo = require("mongodb-wrapper"),
    ObjectID = mongo.ObjectID,
    util = require("util")
    Schema = require("./schema");

module.exports= function(dbname, host, port){
  var self = this;
  self.db = mongo.db((host || "localhost"), (port || 27017), dbname);
  self.models = {};
  self.lookups = {};
  self.createSchema = function(){
    return new Schema(self);
  };
  return self;
};
