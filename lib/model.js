var mongo = require("mongodb-wrapper"),
    async = require("async"),
    util = require("util"),
    ObjectID = mongo.ObjectID;

var Model = function(schema, modelName) {
  var modelClass = this, fld;
  var Instance = function(partial, validate_all) {
    if (!partial) {
      partial = {};
    }
    var field,
        self = this;
    validate_all = validate_all | false;
    self.modelName = modelName;
    self._hasID = false;
    self.values = {};
    self.global_changes = [];
    // instantiate the partially provided values
    for (field in schema.sub_schemas.publics) {
      if (partial.hasOwnProperty(field)){
        if (schema.validateField(partial[field], field, validate_all)) {
          self.values[field] = partial[field];
        }
      } else if (schema.sub_schemas.publics[field].array === true) {
        self.values[field] = [];
      } else if (typeof schema.sub_schemas.publics[field].type === 
          typeof String) {
        //self.values[field] = new schema.sub_schemas.publics[field].type();
      }
    }
    for (field in schema.sub_schemas.privates) {
      if (partial.hasOwnProperty(field)){
        if (schema.validateField(partial[field], field, validate_all)) {
          self.values[field] = partial[field];
        }
      } else if (schema.sub_schemas.privates[field].array === true) {
        self.values[field] = [];
      } else if (typeof schema.sub_schemas.privates[field].type === typeof String) {
        //self.values[field] = new schema.sub_schemas.privates[field].type();
      }
    }
    for (field in schema.sub_schemas.embeds) {
      if (partial.hasOwnProperty(field)){
        if (schema.validateField(partial[field], field, validate_all)) {
          self.values[field] = partial[field];
        }
      } else if (schema.sub_schemas.embeds[field].array === true) {
        self.values[field] = [];
      } else {
        self.values[field] = null;
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
    var genPaths = function(lookups, addpath) {
      var ret = [], path, model, field;
      for (path in lookups) {
        model = path.substring(0, path.indexOf('.'));
        field = path.substring(path.indexOf('.')+1);
        ret.push({model: model, field: field});
      }
      console.log(ret);
    };
    var genDiff = function() {
      var field, diff = {};
      for (field in self.values) {
        if (partial[field] && self.values[field] === partial[field]) {
          continue;
        }
        if (field === "_id") {
          continue;
        }
        diff[field] = self.values[field];
      }
      return diff;
    };
    var findGlobals = function(diff) {
      var field, field_def, globals = [];
      for (field in diff) {
        if (schema.remongo.models[modelName].schema.sub_schemas.publics[field]) {
          globals.push(field);
        } else if (schema.remongo.models[modelName].schema.sub_schemas.embeds[field]) {
          field_def = schema.remongo.models[modelName].schema.getFieldDef(field);
          if (field_def.include_anyway) {
            globals.push(field);
          }
        }
      }
      return globals;
    };
    var genUpdateQueue = function(lookups, diff, globals) {
      var field, array$, query, command, containingFieldDef, i, j, 
          updateQueue = [], propQueue = [], propLookup;
      for (i = 0; i < lookups.length; i ++ ){
        if (lookups[i].field === null) {
          //self update
          if (!self._hasID ) {
            throw new Error("can't update an object that's not in the db!");
          }
          updateQueue.push({
            model: lookups[i].model,
            query: {_id: self.values._id},
            command: {$set: diff}
          });
        } else {
          containingFieldDef = schema.remongo.models[lookups[i].model].schema
            .getFieldDef(lookups[i].field);
          if (containingFieldDef.include_anyway) {
            propQueue.push({l:lookups[i], def: containingFieldDef});
          }
          query = {};
          query[lookups[i].field + '._id'] = self.values._id;
          command = {};
          array$ = (containingFieldDef.array === true)?".$":"";
          for (j = 0; j < globals.length; j++) {
            command[lookups[i].field + array$ + '.' + globals[j]] =
              diff[globals[j]];
          }
          if (Object.keys(command).length) {
            updateQueue.push({
              model: lookups[i].model,
              query: query ,
              command: {$set: command}
            });
          }
        }
      }
      for (i = 0; i < propQueue.length; i++) {
        //console.log(propQueue[i]);
        for (j = 0; j < schema.remongo.lookups[propQueue[i].l.model].length; j++) {
          propLookup = schema.remongo.lookups[propQueue[i].l.model][j];
          if (propLookup.field === null) {
            continue;
          }
          containingFieldDef = schema.remongo.models[propLookup.model].schema
            .getFieldDef(propLookup.field);
          //console.log(containingFieldDef);
          if (containingFieldDef.array === false) {
            query = {};
            query[propLookup.field + "." + propQueue[i].l.field + "._id"] = 
              self.values._id;
            command = {};
            array$ = (propQueue[i].def.array === true)?".$":"";
            for (k = 0; k < globals.length; k++) {
              command[propLookup.field + '.' + propQueue[i].l.field + array$ + '.' + globals[k]] =
                diff[globals[k]];
            } 
            if (Object.keys(command).length) {
              updateQueue.push({
                model: propLookup.model,
                query: query,
                command: {$set: command}
              });
            }
          }
        }
      }
      return updateQueue;
    };
    self.save = function(cb) {
      var diff, lookup, uQueue;
      if (self._hasID) {
        diff = genDiff();
        uQueue = genUpdateQueue(schema.remongo.lookups[modelName], diff, findGlobals(diff));
        async.map(uQueue,
          function(update_desc, cb) {
            console.log(update_desc);
            schema.remongo.db.collection(update_desc.model);
            schema.remongo.db[update_desc.model].update(
              update_desc.query,
              update_desc.command,
              false,
              true,
              cb
            );
          },
          function(err, docs) {
            if (err) throw err;
            if (cb) {
              cb(err, self);
            }
          }
        );
      } else {
        schema.remongo.db[modelName].insert(self.values,
          function(err, docs) {
            if (err) {
              return cb(err);
            }
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
      var def, field;
      for (field in update_values) {
        if (schema.sub_schemas.privates.hasOwnProperty(field)) {
          if (schema.validateField(update_values[field], field)) {
            self.values[field] = update_values[field];
          }
        } else if (schema.sub_schemas.publics.hasOwnProperty(field)) {
          if (schema.validateField(update_values[field], field)) {
            if (self.global_changes.indexOf(field) == -1) {
              self.global_changes.push(field);
            }
            self.values[field] = update_values[field];
          }
        } else {
          if (schema.validateField(update_values[field], field)) {
            if (schema.sub_schemas.embeds[field].include_anyway) {
              if (self.global_changes.indexOf(field) == -1) {
                self.global_changes.push(field);
              }
            }
            self.values[field] = update_values[field];
          }
        }
      }
      if (cb) {
        cb(null, self);
      } else {
        self.save(function(err) { 
          if(err) { 
            console.log("ERROR WHEN UPDATING INSTANCE:", util.inspect(update_values));
          }
        });
      }
    };
    self.remove = function(cb) {
      if (self._hasID) {
        // remove the stand-alone instance of the object
        schema.remongo.db.collection(modelName);
        schema.remongo.db[modelName].remove({_id: self.values._id}, cb);
        // remove any other existing instance of that object
        var createRemoveFunc = function(lookup) {
          return function(callback) {
            var def, i, query = {}, update_vals = {}, model, field, 
                embedder_schema, removeCommand = {};
            embedder_schema = schema.remongo.models[lookup.model].schema;
            def = embedder_schema.sub_schemas.embeds[field];
            query[lookup.field + '._id'] = self.values._id;
            if (def && def.array === true) {
              update_vals[lookup.field + ".$"] = "";
              removeCommand = {$unset: update_vals};
            } else if (def) {
              update_vals[lookup.field] = null;
              removeCommand = {$set: update_vals};
            }
            schema.remongo.db.collection(lookup.model);
            schema.remongo.db[lookup.model].update(query, removeCommand, callback);
          };
        };
        var path, lookup, lookupArray = [];
        for (lookup in schema.remongo.lookups[modelName]) {
          lookupArray.push(createRemoveFunc(schema.remongo.lookups[modelName][lookup]));
        }
        async.parallel(lookupArray, function(err, result){
          if (err) return cb(err);
          return cb(null);
        });
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
          self.values[fieldName].push(object.getPublics(true));
        } else {
          self.values[fieldName] = object.getPublics();
        }
      } else {
        throw new Error("field '"+fieldName+"' is not defined for '" +
            modelName+"'");
      }
      return self;
    };
    self.getPublics = function(ignore_include_anyways) {
      var ret = {}, field;
      if (self._hasID) {
        for (field in schema.sub_schemas.publics) {
          if (self.values[field]) {
            ret[field] = self.values[field];
          }
        }
        if (ignore_include_anyways) {
          for (field in schema.sub_schemas.embeds) {
            if (schema.sub_schemas.embeds[field].include_anyway) {
              if (self.values[field]) {
                ret[field] = self.values[field];
              }
            }
          }
        }
        ret._id = self.values._id;
        return ret;
      } 
      throw new Error("save the object to the database before trying to" +
          " get publics fields!");
    };
    self.valuesFor = function(valArr) {
      var i, ret = {};
      for (i=0; i < valArr.length; i += 1) {
        ret[valArr[i]] = (self.values.hasOwnProperty(valArr[i]))?self.values[valArr[i]]:undefined;
      }
      return ret;
    };
    return self;
  };
  Instance.schema = schema;
  Instance.findById = function(id, cb) {
    if (!cb) {
      throw new Error("must call `findById` with a callback!");
    }
    if (typeof id === typeof '') {
      id = new schema.remongo.ObjectID(id);
    }
    schema.remongo.db.collection(modelName);
    schema.remongo.db[modelName].findOne(
      {_id: id},
      function(err, docData) {
        if (err) return cb(err);
        if (docData) {
          cb(null, new Instance(docData), docData);
        } else {
          cb(new Error("db query returned no results"), null);
        }
      }
    );
  };
  Instance.cursorToRemongoArray = function(cursor, cb) {
    cursor.toArray(function(err, arr) {
      if (err) {
        return cb(err);
      }
      async.map(arr, function(db_obj, cb) {
          cb(null, new Instance(db_obj));
        },
        function(err, results) {
          cb(err, results);
        }
      );
    });
  };
  Instance.searchByField = function(field, value, fields, cb) {
    Instance.searchByFieldC(field, value, fields, function(err, cursor) {
      if (err) return cb(err);
      Instance.cursorToRemongoArray(cursor, cb);
    });
  };
  Instance.searchByFieldC = function(field, value, fields, cb) {
    var fieldsPresent = false, query = {};
    if (!cb && (typeof fields == typeof function(){})) {
      cb = fields;
    } else if (!cb && !fields) {
      throw new Error("must call `searchByValue` with a callback!");
    } else {
      fieldsPresent = true;
    }
    query[field] = value;
    schema.remongo.db.collection(modelName);
    var cursor = schema.remongo.db[modelName].find(
      query,
      ((fieldsPresent)?fields:[])
    );
    cb(null, cursor);
  };
  Instance.customSearch = function(query, fields, cb) {
    Instance.customSearchC(query, fields, function(err, cursor) {
      if (err) return cb(err);
      Instance.cursorToRemongoArray(cursor, cb);
    });
  };
  Instance.customSearchC = function(query, fields, cb) {
    schema.remongo.db.collection(modelName);
    var cursor = schema.remongo.db[modelName].find(query, fields);
    cb(null, cursor);
  };
  Instance.findOne = function(query, fields, cb) {
    schema.remongo.db.collection(modelName);
    schema.remongo.db[modelName].findOne(query, fields, function(err, doc) {
      if (err) {
        return cb(err);
      }
      if (doc) {
        cb(null, new Instance(doc));
      } else {
        cb(new Error("query for findOne returned no result"));
      }
    });
  };
  /*
   * Unsafe update, for users who know what they're doing
   */
  Instance.updateAll = function(criteria, updateCommand, cb) {
    //stupidest function I wrote all day
    schema.remongo.db.collection(modelName);
    schema.remongo.db[modelName].update(criteria, updateCommand, cb);
  };
  Instance.clear = function(options, cb) {
    if (!options || !options.forreal) {
      throw new Error("To avoid accidental deletes, `clear` requires the" +
          " first parameter to be an object containing `forreal: true`");
    }
    schema.remongo.db.collection(modelName);
    schema.remongo.db[modelName].remove({}, cb);
  };
  Instance.checkPublics = function(testVal) {
    var field;
    for (field in testVal) {
      if (field == '_id') {
        continue;
      }
      if (schema.sub_schemas.publics.hasOwnProperty(field)){
        if (!schema.validateField(testVal[field], field)) {
          throw new Error("could not validate value given for field '" +
              field+"'");
        }
      } else if (schema.sub_schemas.embeds.hasOwnProperty() &&
          schema.sub_schemas.embeds[field].include_anyway) {
        if (!(Array.isArray(testVal[field]) &&
            schema.sub_schemas.embeds[field].array)) {
          throw new Error("field '"+field+"' is designated an array, but" +
              " non-array test value given!");
        } else if (!(!Array.isArray(testVal[field]) &&
              !schema.sub_schemas.embeds[field].array)) {
          throw new Error("field '"+field+"' is designated as single value," +
              " but array test value given!");
        } else {
          throw new Error("object of model '"+modelName+"' contains " +
              "unrecognized value for '"+field+"'");
        }
      }
    }
    return true;
  };
  // create the collection for the model and ensureIndex for all unique fields
  schema.remongo.db.collection(modelName);
  var fn = function(err) {
    console.log(err);
  }, idxQuery = {};
  for (fld in schema.sub_schemas.publics) {
    if (schema.sub_schemas.publics[fld].unique) {
      idxQuery = {};
      idxQuery[fld] = 1;
      schema.remongo.db[modelName].ensureIndex(idxQuery, {unique: true}, fn);
    }
  }
  for (fld in schema.sub_schemas.privates) {
    if (schema.sub_schemas.privates[fld].unique) {
      idxQuery = {};
      idxQuery[fld] = 1;
      schema.remongo.db[modelName].ensureIndex(idxQuery, {unique: true}, fn);
    }
  }
  Instance.ObjectID = ObjectID;
  return Instance;
};

module.exports = Model;
