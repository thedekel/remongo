var assert = require('assert'),
    Remongo = require('./../index');

suite('remongo:', function(){
  test('new models can be created', function(){
    var remongo = new Remongo("test_db");
    var userScheme = remongo.createScheme();
    var eventScheme = remongo.createScheme();
    eventScheme.save("Event");
    userScheme.publics({
      name: String
    });
    userScheme.privates({
      password: String
    });
    userScheme.derives({
      events: ["Event"]
    });
    userScheme.save("User");
    assert.ok(remongo.models.User);
    var testInstance = new remongo.models.User({name: "test", password:"123456"});
    assert.ok(testInstance.save);
    assert.ok(testInstance.remove);
    assert.ok(testInstance.values);
  });

  test("models can be created with missing fields", function(){
    var remongo = new Remongo("test_db");
    var userScheme = remongo.createScheme()
      .publics({
        name: String,
        email: String
      })
      .privates({
        password: String
      });
    userScheme.save("User");
    assert.doesNotThrow(function(){
      var testInstance = new remongo.models.User({name: "test", password:"123456"}); 
    });
  });

  test("type checking on new instances of models", function(){
    var remongo = new Remongo("test_db");
    var userScheme = remongo.createScheme()
      .publics({
        name: String,
      });
    userScheme.save("User");
    assert.throws(function(){
      var testInstance = new remongo.models.User({name: 123});
    });
  });
});
 
