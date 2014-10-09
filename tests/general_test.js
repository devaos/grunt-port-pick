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
    p.first = 8760
    p.findPort(function(err, port) {
      test.equal(8760, port)
      test.done()
    })
  },
  findPortUnavailableTest: function(test) {
    var net = require('net'),
        p = new portPick(grunt)

    net.createServer().on('error', function(e) {
      test.done()
    }).addListener('listening', function() {
      p.first = 8762
      p.findPort(function(err, port) {
        test.equal(8763, port)
        test.done()
      })
    }).listen(8762, 'localhost');
  },
  findTryPortTest: function(test) {
    var p = new portPick(grunt)
    p.tryPorts = [8769]
    p.findPort(function(err, port) {
      test.equal(8769, port)
      test.done()
    })
  },
  findTryMultiPortTest: function(test) {
    var p = new portPick(grunt)
    p.tryPorts = [8769,8770]
    p.findPort(function(err, port) {
      test.equal(8769, port)
      p.findPort(function(err, port) {
        test.equal(8770, port)
        test.done()
      })
    })
  }
};
