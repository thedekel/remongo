var Remongo = require('./../index');

//init simple schema
var util = require('util');
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

exports['new models appear on lookup'] = function(be, assert) {
  assert.ok(remongo.lookups.User);
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
        name: "testUser2"
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


exports['update public and private fields'] = function(be, assert) {
  var simpleInstance = new remongo.models.User(
      {
        name: "testUser7",
        email: "test@user7.com",
        pass: "password"
      });
  simpleInstance.save(function(err, doc) {
    if (err) assert.fail(err);
    remongo.models.User.findById(doc.values._id, function(err, instance) {
      instance.update({name: "testUser7Edited", pass:"drowssap"}, 
        function(err, updated_instance) {
          assert.eql(updated_instance.values.name, "testUser7Edited");
          assert.eql(updated_instance.values.pass, "drowssap");
          updated_instance.save();
        }
      );
    });
  });
};

exports['search by field value'] = function(be, assert) {
  var simpleInstance1 = new remongo.models.User(
      {
        name: 'non-unique-name',
        email: 'test@user8.com',
        pass: 'password'
      });
  var simpleInstance2 = new remongo.models.User(
      {
        name: 'non-unique-name',
        email: 'test@user9.com',
        pass: 'password'
      });
  simpleInstance1.save(function(err, doc) {
    simpleInstance2.save(function(err2, doc2) {
      if (err || err2) return assert.fail(err, err2);
      remongo.models.User.searchByField('name', 'non-unique-name', [], 
        function(err3, docsArr) {
          assert.notEqual(0,docsArr.length);
          assert.eql(docsArr[0].values.name, 'non-unique-name');
        }
      );
    });
  });
};

exports['custom search'] = function(be, assert) {
  var simpleInstance1 = new remongo.models.User(
      {
        name: 'testUser10',
        email: 'test@user10.com',
        pass: 'password'
      });
  simpleInstance1.save(function(err, doc) {
    if (err) return assert.fail(err);
    remongo.models.User.customSearch({email: 'test@user10.com'}, [], 
      function(err3, docsArr) {
        assert.notEqual(0,docsArr.length);
        assert.eql(docsArr[0].values.email, 'test@user10.com');
      }
    );
  });
};
