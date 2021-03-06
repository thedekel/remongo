var Model = require("./model");

var Field = function(definition, fieldName) {
  /*
   * a definition can be just a type:
   * field: String
   *
   * or an array with that type:
   * field: [String]
   *
   * or something of the form:
   * field: {
   *   type: String,
   *   rquired: true,
   *   unique: true,
   *   array: false,
   * }
   *
   * and for embedded models as fields:
   * field: "User"
   *
   * or:
   * field: ["user"]
   *
   * or
   * field: {
   *   modelName: "User"
   * }
   */
  var self = this;
  self.type = null;
  self.modelName = "";
  self.required = false;
  self.unique = false;
  self.array = false;
  self.accept_any = false;
  self.array_limit = 0; // array of unlimited length
  self.include_anyway = false;
  if (typeof definition  === typeof String) {
    //case 1: definition is a constructor for a primitive such as String
    self.type = definition;
  } else if (Array.isArray(definition) &&
            definition.length &&
            typeof definition[0] === typeof String) {
    //case 2: definition is an array of constructors
    self.type = definition[0];
    self.array = true;
    //optional: second value in array is the size limit of the array
    if (definition.length > 1 && typeof definition[1] === typeof 0) {
      self.array_limit = definition[1];
    }
  } else if (typeof definition === typeof "") {
    //case 3: definition is a String representing another model
    self.type = "RemongoModel";
    self.modelName = definition;
  } else if (Array.isArray(definition) &&
            definition.length &&
            typeof definition[0] === typeof "") {
    //case 4: definition is an array of Strings representing another model
    self.type = "RemongoModel";
    self.modelName = definition[0];
    self.array = true;
    //optional: second value in array is the size limit of the array
    if (definition.length > 1 && typeof definition[1] === typeof 0) {
      self.array_limit = definition[1];
    }
  } else if (typeof definition === typeof {} &&
      definition.hasOwnProperty('type')) {
    //case 5: definition is a description object
    if (typeof definition.type === typeof String ||
        typeof definition.type === typeof "") {
      self.type = (typeof definition.type === typeof String)?
        definition.type : "RemongoModel";
      if (self.type === "RemongoModel") {
        self.modelName = definition.type;
      }
    } else {
      throw new Error("value for field definition '" +
          fieldName +"' must be a primitive or another Remongo-Model's name");
    }
    if (definition.hasOwnProperty('array')) {
      if (typeof definition.array === typeof true) {
        self.array = definition.array;
      } else {
        throw new Error("field definition value for 'array' must be boolean");
      }
    }
    if (definition.hasOwnProperty('required')) {
      if (typeof definition.required === typeof true) {
        self.required = definition.required;
      } else {
        throw new Error("field definition value for 'required' must be boolean");
      }
    }
    if (definition.hasOwnProperty('unique')) {
      if (typeof definition.unique === typeof true) {
        self.unique = definition.unique;
      } else {
        throw new Error("field definition value for 'unique' must be boolean");
      }
    }
    if (definition.array_limit) {
      if (typeof definition.array_limit === typeof 0) {
        self.array_limit = definition.array_limite;
      } else {
        throw new Error(
            "field definition value for 'array_limit' must be a number");
      }
    }
    if (definition.accept_any) {
      if (typeof definition.accept_any === typeof true) {
        self.accept_any = definition.accept_any;
      }
    }
    if (self.type == "RemongoModel" && definition.include_anyway) {
      if (typeof definition.include_anyway === typeof true) {
        self.array_limit = definition.array_limite | self.array_limit;
        self.include_anyway = definition.include_anyway | self.include_anyway;
      } else {
        throw new Error("field definition value for 'include_anyway' must be" +
            " boolean");
      }
    }
  } else {
    //unrecognized value; do not use
    throw new Error("value for field definition '" + 
        fieldName +"' is invalid!");
  }
  return self;
};

var Schema = function(remongo) {
  var self = this,
      required = [];
  self.sub_schemas = {
    publics : {},
    privates : {},
    embeds : {}
  };
  if (!remongo) {
    throw new Error("schema object initialized without reference to remongo");
  }
  self.remongo = remongo;
  self.defineSubSchema = function(type, schema) {
    var field;
    if (self.sub_schemas.hasOwnProperty(type)) {
      for (field in schema) {
        self.sub_schemas[type][field] = new Field(schema[field], field);
        if (self.sub_schemas[type][field].type == "RemongoModel" && 
            type != "embeds") {
          throw new Error("you may only place remongo models in embeds!");
        }
        if (self.sub_schemas[type][field].required) {
          required.push([type, field]);
        }
      }
    } else {
      throw new Error("Subschema must be 'publics', 'privates' or 'embeds'");
    }
  };
  self.publics = function(partial_schema) {
    self.defineSubSchema("publics", partial_schema);
    return self;
  };
  self.privates = function(partial_schema) {
    self.defineSubSchema("privates", partial_schema);
    return self;
  };
  self.embeds = function(partial_schema) {
    self.defineSubSchema("embeds", partial_schema);
    return self;
  };
  self.save = function(modelName) {
    var path, field;
    remongo.models[modelName] = Model(self, modelName);
    if (!remongo.lookups[modelName]) {
      remongo.lookups[modelName] = [];
    }
    remongo.lookups[modelName].push({model: modelName, field: null});
    for (field in self.sub_schemas.embeds) {
      path = modelName + "." + field;
      if (remongo.lookups[self.sub_schemas.embeds[field].modelName]) {
        remongo.lookups[self.sub_schemas.embeds[field].modelName].push({
          model: modelName,
          field: field
        });
      } else {
        remongo.lookups[self.sub_schemas.embeds[field].modelName] = [];
        remongo.lookups[self.sub_schemas.embeds[field].modelName].push({
          model: modelName,
          field: field
        });
      }
    }
    return self;
  };
  self.ensureRequired = function(values) {
    var i;
    for (i = 0; i < required.length; i += 1) {
      if (!values.hasOwnProperty(required[i][1])){
        throw new Error("object instance missing required field '" +
            required[i][1] +"'");
      }
    }
    return true;
  };
  self.getFieldDef = function(field) {
    return self.sub_schemas.publics[field] || 
      self.sub_schemas.privates[field] ||
      self.sub_schemas.embeds[field];
  };
  self.validateField = function(testValue, field, validate_all) {
    var field_def = self.sub_schemas.publics[field] || 
                    self.sub_schemas.privates[field] ||
                    self.sub_schemas.embeds[field];
    var i;
    var checkType = function(type, value) {
      return (typeof value == type.name.toLowerCase() ||
          value instanceof type);
    };
    validate_all = validate_all | false;
    if (!field_def) {
      throw new Error("specified field '"+field+"' doesn't exist in schema!");
    }
    if (field_def.array) {
      if (!Array.isArray(testValue)){
        throw new Error("'"+field+"' is expected to be an array");
      }
      if (field_def.array_limit != 0 && 
          field_def.array_limit < testValue.length) {
        throw new Error("'"+field+"' contains more element than expected");
      }
      if (testValue.length) {
        if (field_def.type === "RemongoModel") {
          if (validate_all) {
            for (i = 0; i < testValue.length; i+=1) {
              if (remongo.models[field_def.modelName]) {
                if (remongo.models[field_def.modelName].checkPublics(
                      testValue[i])) {
                  continue;
                }
                throw new Error("object in '"+field+"' array is not of the" +
                    " correct remongo model type");

              } else {
                throw new Error("model name defined for '"+filed+"' does not" +
                    " exist in this remongo instance");
              }
            }
          } else {
            if (remongo.models[field_def.modelName]) {
              if (!remongo.models[field_def.modelName].checkPublics(
                    testValue[0])) {
                throw new Error("first element in '"+field+"' array is not of" + 
                  " the correct remongo model type");
              }
            } else {
              throw new Error("model name defined for '"+filed+"' does not" +
                  " exist in this remongo instance");
            }
          }
        } else {
          if (validate_all) {
            for (i = 0; i < testValue.length; i+=1) {
              if (checkType(field_def.type, testValue[i])) {
                continue;
              }
              throw new Error("object in '"+field+"' array is invalid!");
            }
          } else {
            if (!checkType(field_def.type, testValue[0])) {
              throw new Error("first element in '"+field+"' array is invalid" + 
                " please ensure that all values in array are valid!");
            }
          }
        }
      }
    } else {
      if (field_def.type === "RemongoModel") {
        if (remongo.models[field_def.modelName]) {
          if (!remongo.models[field_def.modelName].checkPublics(
              testValue)) {
            throw new Error("object provided for '"+field+"' is not of the" +
              " correct remongo model type");
          }
        } else {
          throw new Error("model name defined for '"+filed+"' does not" +
              " exist in this remongo instance");
        }
      } else {
        if (!field_def.accept_any && !checkType(field_def.type, testValue)) {
          throw new Error("value provided for '"+field+"' is not of the" +
            " correct type");
        }
      }
    }
    return true;
  };
  return self;
};


module.exports = Schema;
