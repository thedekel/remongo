var mongo = require("mongodb-wrapper"),
    util = require("util");

var genModel = function(schema, modelName){
  /* when a model is generated, the following constructor is returned for
   * instantiation of the model */
  var newModelObject = function(partial){
    var field;
    var self = this;
    self._modelName = modelName;
    self.values = {};
    /* iterate over publics, privates and derives provided in the schema
     * when an object is instantiated, make sure they exist and are proper */
    for (field in schema._publics){ //look at each public field is schema
      if (partial.hasOwnProperty(field)){ //see if the partial object contains 
                                          //that field
        if (typeof schema._publics[field] === typeof String){ //... and that 
                                                              // it's formatted
                                                              // properly
          if (typeof partial[field] == schema._publics[field].name.toLowerCase()){
            self.values[field] = partial[field];
          } else {
            throw new Error("type mismatch for public field: " + field);
          }
        }
      } else if (typeof schema._publics[field] === typeof String){
        // if the field is a callable function, I assume that it's a type,
        // which means that I can instantiate a new object of it as a "blank"
        // field
        self.values[field] = new schema._publics[field]();
      } else {
        throw new Error("must instantiate all public fields");
      }
    }
    for (field in schema._privates){ //same concept as previous loop
      if (field === "_id"){
        throw new Error('_id field must be public!');
      }
      if (partial.hasOwnProperty(field)){
        if (typeof schema._privates[field] === typeof String){
          if (typeof partial[field] == schema._privates[field].name.toLowerCase()){
            self.values[field] = partial[field];
          } else {
            throw new Error("type mismatch for public field: " + field);
          }
        }
      } else if (typeof schema._privates[field] === typeof String){
        self.values[field] = new schema._privates[field]();
      } else {
        throw new Error("must instantiate all private fields");
      }
    }
    for (field in schema._derives){
      if (field === "_id"){
        throw new Error('_id field must be public!');
      }
      if (partial.hasOwnProperty(field)){
        if (Array.isArray(schema._derives[field]) && Array.isArray(partial[field])){
          if (partial[field][0]._modelName && schema._derives[field][0] === partial[field][0]._modelName){
            self.values[field] = partial[field];
          } else {
            throw new Error("provided derived field must be of the appropriate type");
          }
        } else if (partial[field]._modelName && schema._derives[field] === partial[field]._modelName){
          self.values[field] = partial[field];
        }
      } else {
        if (Array.isArray(schema._derives[field])){
          self.values[field] = [];
        }
      }
    }
    self.save = function(cb){
      console.log("this function gets executed!");
      console.log(util.inspect(schema._server), util.inspect(schema._server.db));
      schema._server.db.collection(modelName);
      schema._server.db[modelName].insert(self.values, 
          function(err,doc){
            cb(err, doc);
      });
    };
    self.remove = function(){
    };
    self.embed = function(fieldName, object){
      if (schema._derives[fieldName]){
        if (Array.isArray(schema._derives[fieldName])){
          if (object._modelName && schema._derives[fieldNAme][0] == object._modelName){
            //TODO: INSERT and UPDATE data here for an object embedded in an array
          } else {
            throw new Error(
                "embeddable object is not valid or specified field is not set to hold such an object!");
          }
        } else {
          if (object._modelName && schema._derives[fieldNAme] == object._modelName){
            //TODO: INSERT and UPDATE data here for an object embedded in a field
          } else {
            throw new Error(
                "embeddable object is not valid or specified field is not set to hold such an object!");
          }
        }
      } else {
        throw new Error("field name: '" + fieldName + "' not found in schema!");
      }
    };
  };
  return newModelObject;
};

var _schema = function(server){
  var self = this;
  self._server = server;
  self._publics = {};
  self._privates = {};
  self._derives = {};
  var field;
  var updateSchema = function(schemaName, news){
    var newSchema = news;
    var olds = self["_"+schemaName];
    for (x in olds){
      if (newSchema.hasOwnProperty(x)){
        continue;
      }
      newSchema[x] = olds[x];
    }
    self["_"+schemaName] = newSchema;
  };
  self.publics = function(schema){
    for (field in schema){
      if (typeof schema[field] == typeof String){ //must be a constructor
        continue;
      }
      throw new Error("public fields must be instantiable objects");
    }
    updateSchema("publics", schema);
    return self;
  };
  self.privates = function(schema){
    for (field in schema){
      if (typeof schema[field] == typeof String){ //must be a constructor
        continue;
      }
      throw new Error("private fields must be instantiable objects");
    }
    updateSchema("privates", schema);
    return self;
  };
  self.derives = function(schema){
    for (field in schema){
      if ((Array.isArray(schema[field]) && schema[field].length === 1 
            && typeof schema[field][0] === typeof "test") || 
          typeof schema[field] === typeof "test"){ //must be a String or array of Strings
            continue;
      }
      throw new Error("private fields must be instantiable objects");
    }
    updateSchema("derives", schema);
    return self;
  };
  self.printschema = function(){
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
  var self = this;
  self.db = mongo.db((host || "localhost"), (port || 27017), dbname);
  self._schemas = {};
  self.models = {};
  self.lookups = {};
  self.test_colls = function(){
    self.db.collection('posts').insert({
      test:"yes"
    });
    return true;
  };
  self.createSchema = function(){
    return new _schema(self);
  };
  return self;
};
