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

exports['query simple instance by id'] = function(be, assert) {
  var simpleInstance = new remongo.models.User(
      {
        name: "testUser5",
        email: "test@user5.com",
        pass: "password"
      });
  simpleInstance.save(function(err, doc){
    if(err) assert.fail(err);
    assert.ok(doc.values._id);
    assert.eql(doc.values._id, simpleInstance.values._id);
    assert.doesNotThrow(function() {
      remongo.models.User.findById(doc.values._id, function(err, instance) {
        if (err) assert.fail(err);
        assert.eql(true, instance instanceof remongo.models.User);
        // make sure that dataOut == dataIn
        assert.eql(doc.values._id, instance.values._id);
        assert.eql(instance.values.name, "testUser5");
        assert.eql(instance.values.email, "test@user5.com");
        assert.eql(instance.values.pass, "password");
      });
    });
  });
};

exports['simple instances can be removed from db'] = function(be, assert) {
  var simpleInstance = new remongo.models.User(
      {
        name: "testUser5",
        email: "test@user5.com",
        pass: "password"
      });
  simpleInstance.save(function(err, doc) {
    if (err) assert.fail(err);
    remongo.models.User.findById(doc.values._id, function(err, instance) {
      if (err) assert.fail(err);
      instance.remove(function(err) {
        if (err) assert.fail(err);
        remongo.models.User.findById(doc.values._id, function(err, instance2) {
          assert.isNull(instance2);
        });
      });
    });
  });
};
