var assert = require('assert'),
    Remongo = require('./../index');

suite('models: ', function(){
  test('new models can be created', function(){
    var remongo = new Remongo("test_db1");
    var userSchema = remongo.createSchema();
    var eventSchema = remongo.createSchema();
    eventSchema.save("Event");
    userSchema.publics({
      name: String
    });
    userSchema.privates({
      password: String
    });
    userSchema.derives({
      events: ["Event"]
    });
    userSchema.save("User");
    assert.ok(remongo.models.User);
    var testInstance = new remongo.models.User({name: "test", password:"123456"});
    assert.ok(testInstance.save);
    assert.ok(testInstance.remove);
    assert.ok(testInstance.values);
  });

  test("models can be created with missing fields", function(){
    var remongo = new Remongo("test_db2");
    var userSchema = remongo.createSchema()
      .publics({
        name: String,
        email: String
      })
      .privates({
        password: String
      });
    userSchema.save("User");
    assert.doesNotThrow(function(){
      var testInstance = new remongo.models.User({name: "test", password:"123456"}); 
    });
  });

  test("type checking on new instances of models", function(){
    var remongo = new Remongo("test_db3");
    var userSchema = remongo.createSchema()
      .publics({
        name: String,
      });
    userSchema.save("User");
    assert.throws(function(){
      var testInstance = new remongo.models.User({name: 123});
    });
  });

  test("models are added to lookup table", function(){
    var remongo = new Remongo("test_db4");
    var userSchema = remongo.createSchema()
      .publics({
        name: String,
      });
    userSchema.save("User");
    assert.ok(remongo.lookups["User"]);
    assert.ok(remongo.lookups["User"]["User"]);
    assert.strictEqual(remongo.lookups["User"]["User"], true);
  });

  test("derives are added to lookup table", function(){
    var remongo = new Remongo("test_db5");
    var userSchema = remongo.createSchema();
    var eventSchema = remongo.createSchema();
    eventSchema.save("Event");
    userSchema.publics({
      name: String
    });
    userSchema.privates({
      password: String
    });
    userSchema.derives({
      events: ["Event"]
    });
    userSchema.save("User");
  });

  test("simple instances can be saved to db once created", function(){
    var remongo = new Remongo("test_db6");
    var userSchema = remongo.createSchema();
    userSchema.publics({
      name: String,
      email: String
    });
    userSchema.privates({
      password: String
    });
    userSchema.save("User");

    assert.doesNotThrow(function(){
      var jarvis = new remongo.models.User({name:"Jarvis", 
        email:"magicjarvis@gmail.com", password: "iamtomer"});
      jarvis.save(function(err, doc){
        console.log('err', err, 'doc', doc);
      });
    });
  });

  test("complex instances can be saved to db once created", function(){
  });

  test("instances of a model can be queried from db by ID", function(){
  });

  test("instances can be removed from db", function(){
  });

  test("instances can be embedded in other instances if type is correct", function(){
  });
});
 
