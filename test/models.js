var assert = require('assert'),
    Remongo = require('./../index');

suite('remongo', function(){
  test('new models can be created', function(){
    var remongo = new Remongo("test_db");
    var userModel = remongo.createModel("User");
    userModel.publics({
      name: String
    });
    userModel.privates({
      password: String
    });
    userModel.derives({
      events: {
        model: "Event",
        array: true
      }
    });
    console.log(userModel.printScheme());
  });
});
 
