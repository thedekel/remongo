var assert = require('assert'),
    Remongo = require('./../index');

suite('remongo', function(){
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
    var testInstance = new remongo.models.User({name: "test", password:"123456", events:[new remongo.models.Event({})]});
    assert.ok(testInstance.save);
    assert.ok(testInstance.remove);
    assert.ok(testInstance.values);
    console.log(testInstance.values);
  });

  test("models can't be created with missing fields", function(){
    var remongo = new Remongo("test_db");
    var userScheme = remongo.createScheme()
      .publics({
        name: String,
        email: "EmailObject"
      })
      .privates({
        password: String
      });
    userScheme.save("User");
  userScheme.save("User");
  assert.throws(function(){
    var testInstance = new remongo.models.User({name: "test", password:"123456"});
  });
  });
});
 
