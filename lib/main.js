var Mongolian = require("mongolian");

module.exports= function(dbname, host, port){
  var server = new Mongolian;
  var self = this;
  self.db = server.db(dbname);
  self.test_colls = function(){
    var posts = self.db.collection("posts");
    posts.insert({
      test:"yes"
    });
    return true;
  };
  return self;
};
