var Mongolian = require("mongolian"),
    util = require("util");

var genModel = function(scheme, modelName){
  var newModelObject = function(partial){
    var field;
    var self = this;
    self._modelName = modelName;
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
      } else {
        throw new Error("must instantiate all public fields");
      }
    }
    for (field in scheme._privates){
      if (partial.hasOwnProperty(field)){
        if (typeof scheme._privates[field] === typeof String){
          if (typeof partial[field] == scheme._privates[field].name.toLowerCase()){
            self.values[field] = partial[field];
          }
        }
      } else if (typeof scheme._privates[field] === typeof String){
        self.values[field] = new scheme._privates[field]();
      } else {
        throw new Error("must instantiate all private fields");
      }
    }
    for (field in scheme._derives){
      if (partial.hasOwnProperty(field)){
        if (Array.isArray(scheme._derives[field]) && Array.isArray(partial[field])){
          if (partial[field][0]._modelName && scheme._derives[field][0] === partial[field][0]._modelName){
            self.values[field] = partial[field];
          } else {
            console.log(scheme.derives, partial[field], field);
            throw new Error("provided derived field must be of the appropriate type");
          }
        } else if (partial[field]._modelName && scheme._derives[field] === partial[field]._modelName){
          self.values[field] = partial[field];
        }
      } else {
        throw new Error("must provide all derived objects");
      }
    }
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
    return self;
  };
  self.privates = function(scheme){
    updateScheme("privates", scheme);
    return self;
  };
  self.derives = function(scheme){
    updateScheme("derives", scheme);
    return self;
  };
  self.printScheme = function(){
    return util.inspect({
      publics: self._publics,
      privates: self._privates,
      derives: self._derives
    });
  };
  self.save = function(modelName){
    server.models[modelName] = genModel(self, modelName);
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
