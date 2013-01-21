var Mongolian = require("mongolian"),
    util = require("util");

var genModel = function(scheme){
  var newModelObject = function(partial){
    var field;
    var self = this;
    self.values = {};
    for (field in scheme._publics){
      if (partial.hasOwnProperty(field)){
        if (typeof scheme._publics[field] === typeof String){
          if (typeof partial[field] == scheme._publics[field].name.toLowerCase()){
            self.values[field] = partial[field];
          }
        }
      } else if (typeof scheme._publics[field] === typeof String){
        self.values[field] = new scheme._publics[field]();
      }
    };
    for (field in scheme._privates){
      if (partial.hasOwnProperty(field)){
        if (typeof scheme._privates[field] === typeof String){
          console.log(typeof partial[field]);
          console.log(scheme._privates[field].name.toLowerCase());
          if (typeof partial[field] == scheme._privates[field].name.toLowerCase()){
            console.log("passed");
            self.values[field] = partial[field];
          }
        }
      } else if (typeof scheme._privates[field] === typeof String){
        self.values[field] = new scheme._privates[field]();
      }
    };
    self.save = function(){
    };
    self.remove = function(){
    };
  };
  return newModelObject;
};

var _scheme = function(server){
  var self = this;
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
  self.save = function(modelName){
    server.models[modelName] = genModel(self);
  };
  return self;
};

module.exports= function(dbname, host, port){
  var server = new Mongolian;
  var self = this;
  self.db = server.db(dbname);
  self._schemes = {};
  self.models = {};
  self.test_colls = function(){
    var posts = self.db.collection("posts");
    posts.insert({
      test:"yes"
    });
    return true;
  };
  self.createScheme = function(){
    return new _scheme(self);
  };
  return self;
};
