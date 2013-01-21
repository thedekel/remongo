var assert = require('assert'),
    Remongo = require('./../index');

suite('remongo', function(){
  test('new models can be created', function(){
    var remongo = new Remongo("test_db");
    var userScheme = remongo.createScheme();
    userScheme.publics({
      name: String
    });
    userScheme.privates({
      password: String
    });
    userScheme.derives({
      events: {
        model: "Event",
        array: true
      }
    });
    userScheme.save("User");
    assert.ok(remongo.models.User);
    var testInstance = new remongo.models.User({name: "test", password:"123456"});
    assert.ok(testInstance.save);
    assert.ok(testInstance.remove);
    assert.ok(testInstance.values);
    console.log(testInstance.values);
  });
});
 
