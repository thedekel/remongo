var mongo = require("mongodb-wrapper"),
    ObjectID = mongo.ObjectID,
    util = require("util")
    Schema = require("./schema");
/*
var genModel = function(schema, modelName){
  var thisclass = this;
  var newModelObject = function(partial){
    var field;
    var self = this;
    self._modelName = modelName;
    self._identifiable = false;
    self.values = {};
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
    for (field in schema._embeds){
      if (field === "_id"){
        throw new Error('_id field must be public!');
      }
      if (partial.hasOwnProperty(field)){
        if (Array.isArray(schema._embeds[field]) && Array.isArray(partial[field])){
          if (partial[field][0]._modelName && schema._embeds[field][0] === partial[field][0]._modelName){
            self.values[field] = partial[field];
          } else {
            throw new Error("provided derived field must be of the appropriate type");
          }
        } else if (partial[field]._modelName && schema._embeds[field] === partial[field]._modelName){
          self.values[field] = partial[field];
        }
      } else {
        if (Array.isArray(schema._embeds[field])){
          self.values[field] = [];
        }
      }
    }
    if (partial.hasOwnProperty("_id")){
      if (partial._id instanceof ObjectID){
        self.values._id = partial._id;
        self._identifiable = true;
      }
    }
    self.save = function(cb){
      schema._server.db.collection(modelName);
      if (self.values._id) {
        schema._server.db[modelName].update(
          { _id: self.values._id },
          self.values,
          function(err, docs){
            if (cb) {
              cb(err, self, docs);
            } 
          }
        );
      } else {
        schema._server.db[modelName].insert(self.values, 
            function(err,docs){
              if (err) throw err;
              if (docs[0] && docs[0]._id) {
                self.values._id = docs[0]._id;
                self._identifiable = true;
                cb(err, self);
              } else {
                cb(new Error("could not assign _id to object on save!"));
              }
        })
      }
    };
    self.update = function(updates){
      var local_changes = [],
        global_changes = [], 
        i;
      for (field in updates) {
        if (field === "_id"){
          throw new Error("the _id field may not be changed through this method");
        }
        if (schema._publics.hasOwnProperty(field) && 
            global_changes.indexOf(field) == -1){
          // validate type
          if (typeof updates[field] == schema._publics[field].name.toLowerCase()){
            global_changes.push(field);
            continue;
          } else {
            throw new Error("provided value for '" + field + "' is invalid");
          }
        } else if (schema._privates.hasownProperty(field) &&
            local_changes.indexOf(field) == -1){
          if (typeof updates[field] == schema._privates[field].name.toLowerCase()){
            local_changes.push(field);
            continue;
          } else {
            throw now Error("provided value for '" + field + "' is invalid");
          }
        } else if (schema._embeds.hasOwnProperty(field) &&
            local_changes.indexOf(field) == -1){
          if (typeof updates[field]
        }
      }
      local_changes = privates_to_change.concat(embeds_to_change);
      global_changes = publics_to_change;
      // first update the original object
      for (i = 0; i < local_changes.length; i ++ ){
        self.values[local_changes[i]] = updates
      }
      schema._server.db.collection(modelName);
      schema._server.db.collection
    };
    self.remove = function(cb){
      if (self._identifiable){
        schema._server.db.collection(modelName);
        schema._server.db[modelName].remove({_id:self.values._id}, cb);
      } else {
        cb(new Error("objects without a valid _id can not be removed from "+
              "the database, they may not even be there in the first palce"));
      }
    };
    self.embed = function(fieldName, object){
      if (schema._embeds[fieldName]){
        if (Array.isArray(schema._embeds[fieldName])){
          if (object._modelName && schema._embeds[fieldName][0] == object._modelName){
            //TODO: INSERT and UPDATE data here for an object embedded in an array
            //later:
            //if (schema._embeds[fieldName].uniques){
            //  code to make sure that two objects with the same _id don't exist
            //}
            self.values[fieldName].push(object.getPublics());
          } else {
            throw new Error(
                "embeddable object is not valid or specified field is not " +
                "set to hold such an object! it's possible that you're " + 
                "either trying to embed an instance of a model in a field " + 
                "that's not configured for that model type, or that the " + 
                "object in question simply isn't a properly formed remongo " + 
                "object.");
          }
        } else {
          if (object._modelName && schema._embeds[fieldName] == object._modelName){
            //TODO: INSERT and UPDATE data here for an object embedded in a field
            self.values[fieldName] = object.getPublics();
          } else {
            throw new Error(
                "embeddable object is not valid or specified field is not " +
                "set to hold such an object! If your object is a plain JS " +
                "object with all the correct data, you may prefer to use " +
                "`embedPlain` (TODO) to have the data automatically parsed " +
                "as an instance of the model in that field.");
          }
        }
      } else {
        throw new Error("field name: '" + fieldName + "' not found in schema!");
      }
      return self;
    };
    self.embedPlain = function(fieldName, object) {
      //TODO: Implement this as a way to fetch the correct model and 
      //instantiate the data in `object` as that model and embed it
      //using `embed()`
    };
    self.getPublics = function(){
      var ret = {};
      for (field in schema._publics) {
        ret[field] = self.values[field];
      }
      if (self._identifiable && self.values._id) {
        ret._id = self.values._id;
      }
      return ret;
    };
  };
  newModelObject.findById = function(id, cb) {
    if (cb) {
      schema._server.db.collection(modelName);
      schema._server.db[modelName].findOne(
        { _id: id },
        function(err, docData) {
          if (err) cb(err);
          if (docData) {
            cb(null, new schema._server.models[modelName](docData), docData);
          } else {
            cb(null, null, docData);
          }
        }
      );
    } else {
      throw new Error("Callback function not provided to model.findById()");
    }
  };
  newModelObject.clear = function(options, cb) {
    if (!options.forreal) {
      cb(new Error("pleas specify {forreal:true}, for real"));
    } else {
      schema._server.db.collection(modelName);
      schema._server.db[modelName].remove({},cb);
    }
  };
  return newModelObject;
};

var _schema = function(server){
  var self = this;
  self._server = server;
  self._publics = {};
  self._privates = {};
  self._embeds = {};
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
      // the following check makes sure that the type provided is a CONSTRUCTOR
      // not specifically a string. This would also work with `typeof Number`
      // and other potential values so long as they are a constructor function
      if (typeof schema[field] == typeof String){ 
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
  self.embeds = function(schema){
    for (field in schema){
      if ((Array.isArray(schema[field]) && schema[field].length === 1 
            && typeof schema[field][0] === typeof "test") || 
          typeof schema[field] === typeof "test"){ //must be a String or array of Strings
            continue;
      }
      throw new Error("private fields must be instantiable objects");
    }
    updateSchema("embeds", schema);
    return self;
  };
  self.printschema = function(){
    return util.inspect({
      publics: self._publics,
      privates: self._privates,
      embeds: self._embeds
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
    for (field in self._embeds){
      var path = modelName + "." + field;
      if (server.lookups[self._embeds[field]]){
        server.lookups[self._embeds[field]][path] = true;
      } else {
        server.lookups[self._embeds[field]] = {};
        server.lookups[self._embeds[field]][path] = true;
      }
    }
  };
  return self;
};
*/
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
    return new Schema(self);
  };
  return self;
};
