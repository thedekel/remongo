var assert = require('assert'),
    Remongo = require('./../index');

//User and Posts
var remongo = new Remongo('simple_db');
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

suite("Embedded Models", function(){
  test("for real man", function(){
    assert.equal(2, 1+1);
  });
});
