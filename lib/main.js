var Mongolian = require("mongolian"),
    util = require("util");

var genModel = function(scheme, modelName){
  /* when a model is generated, the following constructor is returned for
   * instantiation of the model */
  var newModelObject = function(partial){
    var field;
    var self = this;
    self._modelName = modelName;
    self.values = {};
    /* iterate over publics, privates and derives provided in the scheme
     * when an object is instantiated, make sure they exist and are proper */
    for (field in scheme._publics){ //look at each public field is scheme
      if (partial.hasOwnProperty(field)){ //see if the partial object contains 
                                          //that field
        if (typeof scheme._publics[field] === typeof String){ //... and that 
                                                              // it's formatted
                                                              // properly
          if (typeof partial[field] == scheme._publics[field].name.toLowerCase()){
            self.values[field] = partial[field];
          } else {
            throw new Error("type mismatch for public field: " + field);
          }
        }
      } else if (typeof scheme._publics[field] === typeof String){
        // if the field is a callable function, I assume that it's a type,
        // which means that I can instantiate a new object of it as a "blank"
        // field
        self.values[field] = new scheme._publics[field]();
      } else {
        throw new Error("must instantiate all public fields");
      }
    }
    for (field in scheme._privates){ //same concept as previous loop
      if (partial.hasOwnProperty(field)){
        if (typeof scheme._privates[field] === typeof String){
          if (typeof partial[field] == scheme._privates[field].name.toLowerCase()){
            self.values[field] = partial[field];
          } else {
            throw new Error("type mismatch for public field: " + field);
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
            throw new Error("provided derived field must be of the appropriate type");
          }
        } else if (partial[field]._modelName && scheme._derives[field] === partial[field]._modelName){
          self.values[field] = partial[field];
        }
      } else {
        if (Array.isArray(scheme._derives[field])){
          self.values[field] = [];
        }
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
  self._server = server;
  self._publics = {};
  self._privates = {};
  self._derives = {};
  var field;
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
    for (field in scheme){
      if (typeof scheme[field] == typeof String){ //must be a constructor
        continue;
      }
      throw new Error("public fields must be instantiable objects");
    }
    updateScheme("publics", scheme);
    return self;
  };
  self.privates = function(scheme){
    for (field in scheme){
      if (typeof scheme[field] == typeof String){ //must be a constructor
        continue;
      }
      throw new Error("private fields must be instantiable objects");
    }
    updateScheme("privates", scheme);
    return self;
  };
  self.derives = function(scheme){
    for (field in scheme){
      if ((Array.isArray(scheme[field]) && scheme[field].length === 1 
            && typeof scheme[field][0] === typeof "test") || 
          typeof scheme[field] === typeof "test"){ //must be a String or array of Strings
            continue;
      }
      throw new Error("private fields must be instantiable objects");
    }
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
    if (server.lookups[modelName]){
      server.lookups[modelName][modelName] = true;
    } else {
      server.lookups[modelName] = {};
      server.lookups[modelName][modelName] = true;
    }
    for (field in self._derives){
      var path = modelName + "." + field;
      if (server.lookups[self._derives[field]]){
        server.lookups[self._derives[field]][path] = true;
      } else {
        server.lookups[self._derives[field]] = {};
        server.lookups[self._derives[field]][path] = true;
      }
    }
  };
  return self;
};

module.exports= function(dbname, host, port){
  var server = new Mongolian({
    log: {
      debug: function(message) {},
      info: function(message) {},
      warn: function(message) {},
      error: function(message) {}
    }
  });
  var self = this;
  self.db = server.db(dbname);
  self._schemes = {};
  self.models = {};
  self.lookups = {};
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
