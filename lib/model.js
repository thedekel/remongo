var mongo = require("mongodb-wrapper"),
    ObjectID = mongo.ObjectID;

var Model = function(schema, modelName) {
  var modelClass = this;
  var Instance = function(partial, validate_all) {
    var field,
        self = this;
    validate_all = validate_all | false;
    self.modelName = modelName;
    self._hasID = false;
    self.values = {};
    // instantiate the partially provided values
    for (field in schema.sub_schemas.publics) {
      if (partial.hasOwnProperty(field)){
        if (schema.validateField(partial[field], field, validate_all)) {
          self.values[field] = partial[field];
        }
      } else if (typeof schema.sub_schemas.publics[field].type === 
          typeof String) {
        self.values[field] = new schema.sub_schemas.publics[field].type();
      } else if (schema.sub_schemas.publics[field].array == true) {
        self.values[field] = [];
      }
    }
    for (field in schema.sub_schemas.privates) {
      if (partial.hasOwnProperty(field)){
        if (schema.validateField(partial[field], field, validate_all)) {
          self.values[field] = partial[field];
        }
      } else if (typeof schema.sub_schemas.privates[field].type === typeof String) {
        self.values[field] = new schema.sub_schemas.privates[field].type();
      } else if (schema.sub_schemas.privates[field].array == true) {
        self.values[field] = [];
      }
    }
    for (field in schema.sub_schemas.embeds) {
      if (partial.hasOwnProperty(field)){
        if (schema.validateField(partial[field], field, validate_all)) {
          self.values[field] = partial[field];
        }
      } else if (schema.sub_schemas.embeds[field].array == true) {
        self.values[field] = [];
      }
    }
    if (partial.hasOwnProperty("_id")) {
      if (partial._id instanceof ObjectID) {
        self.values._id = partial._id;
        self._hasID = true;
      }
    }
    if (!schema.ensureRequired(self.values)) {
      throw new Error("some required values for instance of '"+modelName+
          "' were not provided!");
    }
    self.save = function(cb) {
      schema.remongo.db.collection(modelName);
      if (self._hasID) {
        schema.remongo.db[modelName].update(
          {_id: self.values._id},
          self.values,
          function(err, docs) {
            if (cb) {
              cb(err, self, docs)
            }
          }
        );
      } else {
        schema.remongo.db[modelName].insert(self.values,
          function(err, docs) {
            if (err) throw err;
            if (docs[0] && docs[0]._id) {
              self._hasID = true;
              self.values._id = docs[0]._id;
              cb(err, self, docs);
            } else {
              cb(new Error("could not assign _id to object on save!"));
            }
          });
      }
    };
    self.update = function(update_values, cb) {
      console.log("DON'T FORGET TO WRIT UPDATE!");
    };
    self.remove = function(cb) {
      if (self._hasID) {
        schema.remongo.db.collection(modelName);
        schema.remongo.db[modelName].remove({_id: self.values._id}, cb);
      } else {
        cb(new Error("objects without a valid _id are likeliy not in the db" +
              "and thus cannot be removed"));
      }
    };
    self.embed = function(fieldName, object) {
      if (schema.sub_schemas.embeds[fieldName]) {
        if (!object.hasOwnProperty("modelName")) {
          throw new Error("object provided for embedding is not a remongo" +
              " object");
        }
        if (schema.sub_schemas.embeds[fieldName].modelName !==
            object.modelName) {
          throw new Error("provided remongo object is not of the correct" +
              " type");
        }
        if (schema.sub_schemas.embeds[fieldName].array) {
          if (schema.sub_schemas.embeds[fieldName].array_limit &&
                (self.values[fieldName].length + 1 > 
                schema.subSchemas.embeds[fieldName].array_limit)) {
            self.values[fieldName].splice(0,1);
          } 
          self.values[fieldName].push(object.getPublics());
        } else {
          self.values[fieldName] = object.getPublics();
        }
      } else {
        throw new Error("field '"+fieldName+"' is not defined for '" +
            modelName+"'");
      }
      return self;
    };
    self.getPublics = function() {
      var ret = {};
      if (self._hasID) {
        for (field in schema.sub_schemas.publics) {
          ret[field] = self.values[field];
        }
        ret._id = self.values._id;
        return ret;
      } 
      throw new Error("you cannot embed an object that doesn't have an ID!");
    };
    return self;
  };
  Instance.findById = function(id, cb) {
    if (!cb) {
      throw new Error("must call `findById` with a callback!");
    }
    schema.remongo.db.collection(modelName);
    schema.remongo.db[modelName].findOne(
      {_id: id},
      function(err, docData) {
        if (err) return cb(err);
        if (docData) {
          cb(null, new schema.remongo.models[modelName](docData), docData);
        } else {
          cb(new Error("db query returned no results"), null , docData);
        }
      }
    );
  };
  Instance.clear = function(options, cb) {
    if (!options || !options.forreal) {
      throw new Error("To avoid accidental deletes, `clear` requires the" +
          " first parameter to be an object containing `forreal: true`");
    }
    schema.remongo.db.collection(modelName);
    schema.remongo.db[modelName].remove({}, cb);
  };
  return Instance;
};

module.exports = Model;
