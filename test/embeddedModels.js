var Remongo = require('./../index');

//User and Posts
var remongo = new Remongo('embedded_db');
var userS = remongo.createSchema();
var postS = remongo.createSchema();

userS.publics({
  name: String,
  email: String
});
userS.privates({
  pass: String
});
userS.embeds({
  posts: ["Post"]
});

postS.publics({
  content: String
});
postS.embeds({
  author: "User"
});

postS.save("Post");
userS.save("User");

exports['embeds added to lookup table'] = function(be, assert) {
  // means that User is a registered model with remongo
  assert.ok(remongo.lookups['User']);
  // means that remongo expects the "User" collection to hold User objects
  // means that remongo expects Post.author to contain users
  assert.ok(remongo.lookups['User']['Post.author']);
  assert.eql(remongo.lookups['User']['Post.author'], true);
  // menas that Post is a registered model with remongo
  assert.ok(remongo.lookups['Post']);
  // means that remongo expects the "Post" collection to hold Post objects
  // means that remongo expects Post.author to contain users
  assert.ok(remongo.lookups['Post']['User.posts']);
  assert.eql(remongo.lookups['Post']['User.posts'], true);
};

exports['saveAndModify'] = function(be, assert) {
  var jarvis = new remongo.models.User({
    name: "Jarvis",
    email: "magicjarvis@gmail.com",
    pass: "iamtomer"
  });
  var jarvissfirstpost = new remongo.models.Post({
    content: "I ate a pie today"
  });
  assert.doesNotThrow(function() {
    jarvis.save(function(err, doc){
      jarvissfirstpost.embed("author", doc);
      jarvissfirstpost.save(function(err, postDoc){
        if (err) {
          assert.fail(err, null);
        }
        jarvis.embed("posts", postDoc).save();
      });
    });
  });
};
