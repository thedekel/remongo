var assert = require('assert'),
    Remongo = require('./../index');

//init simple schema
var remongo = new Remongo('simple_db');
var simpleUserS = remongo.createSchema();

simpleUserS.publics({
  name: String,
  email: String
});
simpleUserS.privates({
  pass: String
});

simpleUserS.save("User");

suite('simple models: ', function(){
  test('instantiate new model', function(){
    assert.doesNotThrow(function(){
      var simpleInstance = new remongo.models.User(
        {
          name: "testUser1",
          email: "test@user1.com",
          pass: "lolpass"
        });
      assert.equal(simpleInstance.values.name, "testUser1");
      assert.equal(simpleInstance.values.email, "test@user1.com");
      assert.equal(simpleInstance.values.pass, "lolpass");
    });
  });

  test('instantiate with missing field', function(){
    assert.doesNotThrow(function(){
      var simpleInstance = new remongo.models.User(
        {
          name: "testUser2",
        });
      assert.equal(simpleInstance.values.name, "testUser2");
      assert.equal(simpleInstance.values.email, "");
      assert.equal(simpleInstance.values.pass, "");
    });
  });

  test('type checking when instantiating', function(){
    assert.throws(function(){
      var simpleInstance = new remongo.models.User(
        {name: 123});
    });
  });

  test('save simple user to db', function(){
    assert.doesNotThrow(function(){
      var simpleInstance = new remongo.models.User(
        {
          name: "testUser4",
          email: "test@user4.com",
          pass: "lolpass"
        });
      assert.equal(simpleInstance.values.name, "testUser4");
      assert.equal(simpleInstance.values.email, "test@user4.com");
      assert.equal(simpleInstance.values.pass, "lolpass");
      simpleInstance.save(function(err, doc){
        assert.ok(doc._id);
      });
    });
  });

  test('simple users are added to lookup table', function(){
    assert.ok(remongo.lookups['User']);
    assert.ok(remongo.lookups['User']['User']);
    assert.strictEqual(remongo.lookups['User']['User'], true);
  });
});
