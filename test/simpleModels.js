var Remongo = require('./../index');

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

exports['new models appear on luukup'] = function(be, assert) {
  assert.ok(remongo.lookups["User"]);
  assert.ok(remongo.lookups["User"]["User"]);
  assert.eql(remongo.lookups["User"]["User"], true);
};

exports['instantiating simple objects'] = function(be, assert) {
  assert.doesNotThrow(function() {
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
};

exports['instantiating with missing field'] = function(be, assert){
  assert.doesNotThrow(function(){
    var simpleInstance = new remongo.models.User(
      {
        name: "testUser2",
      });
    assert.equal(simpleInstance.values.name, "testUser2");
    assert.equal(simpleInstance.values.email, "");
    assert.equal(simpleInstance.values.pass, "");
  });
};

exports['type checking when instantiating'] = function(be, assert){
  assert.throws(function(){
    var simpleInstance = new remongo.models.User(
      {name: 123});
  });
};

exports['save simple user to db'] = function(be, assert){
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
      if (err) {
        assert.fail(err, null);
      }
      assert.ok(doc.values._id);
    });
  });
};

exports['simple users are added to lookup table'] = function(be, assert){
  assert.ok(remongo.lookups['User']);
  assert.ok(remongo.lookups['User']['User']);
  assert.strictEqual(remongo.lookups['User']['User'], true);
};
