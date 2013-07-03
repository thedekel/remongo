var Remongo = require('./../index');

//init simple schema
var remongo = new Remongo('deletions_db');
var simpleUserS = remongo.createSchema();

simpleUserS.publics({
  name: String,
  email: String
});
simpleUserS.privates({
  pass: String
});

simpleUserS.save("User");

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


