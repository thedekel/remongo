var Mongolian = require("mongolian"),
    util = require("util");

var _model = function(name){
  var self = this;
  self.name = name;
  self._publics = {};
  self._privates = {};
  self._derives = {};
  var updateScheme = function(schemeName, news){
    var newScheme = news;
    var olds = self["_"+schemeName];
    for (x in olds){
      if (newScheme.hasOwnProperty(x)){
        continue;
      }
      newScheme[x] = olds[x];
    }
    self["_"+schemeName] = newScheme;
  };
  self.publics = function(scheme){
    updateScheme("publics", scheme);
  };
  self.privates = function(scheme){
    updateScheme("privates", scheme);
  };
  self.derives = function(scheme){
    updateScheme("derives", scheme);
  };
  self.printScheme = function(){
    return util.inspect({
      publics: self._publics,
      privates: self._privates,
      derives: self._derives
    });
  };
  return self;
};

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
  self.createModel = function(name){
    return new _model(name);
  };
  return self;
};
