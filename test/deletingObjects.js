var Remongo = require('./../index');

//init simple schema
var remongo = new Remongo('deletions_db');
var simpleUserS = remongo.createSchema();
var simpleUserS2 = remongo.createSchema();
var postS = remongo.createSchema();

simpleUserS.publics({
  name: String,
  email: String
});
simpleUserS.privates({
  pass: String
});
simpleUserS2.publics({
  name: String,
  email: String
});
simpleUserS2.privates({
  pass: String
});
postS.publics({
  content: String
});
postS.embeds({
  author: "User2"
});

simpleUserS.save("User");
simpleUserS2.save("User2");
postS.save("Post");

exports['clear collection of simple instances'] = function(be, assert) {
  var simpleInstance = new remongo.models.User(
      {
        name: "testUser6",
        email: "test@user6.com",
        pass: "password"
      });
  simpleInstance.save(function(err, doc) {
    if (err) assert.fail(err);
    remongo.models.User.clear({forreal:true}, function(err){
      remongo.models.User.findById(doc.values._id, function(err, instance){
        assert.isNull(instance);
      });
    });
  });
};

exports['embedded instances of an object are removed'] = function(be, assert) {
  var simpleInstance = new remongo.models.User2(
    {
      name: "testUser7",
      email: "test@user7.com",
      pass: "password"
    }
  );
  simpleInstance.save(function(err, doc) {
    if (err) assert.fail(err);
    var simplePost = new remongo.models.Post(
      {
        content: "test hammers"
      }
    );
    simplePost.embed("author", doc);
    simplePost.save(function(err, postDoc /*lol, postDoc*/) {
      remongo.models.User2.findById(doc.values._id, function(err, instance){
        if (err) assert.fail(err);
        if (!instance) assert.fail('no instance in database');
        instance.remove(function(err) {
          if (err) assert.fail(err);
        });
      });
    });
  });
};

