var assert = require('assert'),
    remongo = require('./../index');

suite('remongo', function(){
  test('remongo library file exists', function(){
    assert.ok(remongo);
  });
  test('remongo properties and functions are defined', function(){
    assert.ok(remongo.db);
    assert.ok(remongo.createObject);
  });
});
