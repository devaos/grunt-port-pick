'use strict';

var grunt = require('grunt'),
    portPick = require('../tasks/port-pick')

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.portPick = {
  develFilesOk: [
  ],
  setUp: function(done) {
    // setup here if necessary
    done()
  },
  tearDown: function(done) {
    // teardown here if necessary
    done()
  },
  findPortLimitTest: function(test) {
    var p = new portPick(grunt)
    test.equal(65534, p.findPortLimit(1, false))
    test.equal(1, p.findPortLimit(65534, false))
    test.done()
  },
  findPortTest: function(test) {
    var p = new portPick(grunt)
    test.notEqual(false, p.findPort())
    test.done()
  }
};
