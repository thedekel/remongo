var assert = require('assert'),
    Remongo = require('./../index');

suite('existence: ', function(){
  test('remongo library file exists', function(){
    assert.ok(Remongo);
  });
  test('remongo properties and functions are defined', function(){
    var remongo = new Remongo("test_db", "localhost", 27017);
    assert.ok(remongo.db);
    assert.ok(remongo.test_colls);
    assert.doesNotThrow(function(){
      remongo.test_colls();
    });
  });
});
