/**
 * Copyright (c) 2014 Ari Aosved
 * http://github.com/devaos/grunt-port-pick/blob/master/LICENSE
 */

'use strict';

module.exports = function(grunt) {

  var portscanner = require('portscanner'),
      pp = this,
      options = {
        hostname: '0.0.0.0',
        port: 8765,
        limit: false,
        extra: 0
      }

  // Don't exceed the maximum port when scanning for an available one
  this.findPortLimit = function(start, limit) {
    if(limit === false || start + limit > 65535) {
      limit = Math.max(0, 65535 - start)

      if(grunt.option('verbose')) {
        grunt.log.writeln('Options: ' + ('limit=' + limit).cyan)
      }
    }

    return limit;
  }

  // Find an available port or bail if none is found
  this.findPort = function(callback) {
    portscanner.findAPortNotInUse(options.port,
      options.port + options.limit, options.hostname,
      function(error, foundPort) {
        // If we use a port, increment so that it isn't used again
        if(foundPort !== false)
          options.port = foundPort

        if(typeof callback === 'function')
          callback(null, foundPort)
        else
          return foundPort
    })
  }

  grunt.registerMultiTask('portPick',
    'Scan and pick an available port, for other grunt tasks', function() {

    //==========================================================================

    var async = require('async'),
        done = this.async(),
        self = this

    options = this.options(options)

    //==========================================================================

    options.limit = pp.findPortLimit(options.port, options.limit)

    if(!this.data || !(this.data instanceof Object)) {
      this.data = {}

      if(!this.data.targets || !(this.data.targets instanceof Array)) {
        this.data.targets = []
      }
    }

    //==========================================================================

    async.waterfall([
      pp.findPort,

      // Override the configurations we were told to override
      function(selectedPort, callback) {
        if(selectedPort === false)
          grunt.fatal('No available port was found')

        self.data.targets.forEach(function(prop) {
          grunt.config.set(prop, selectedPort)
        })

        if(options.name) {
          console.log(options.name + '=' + selectedPort)
          grunt.config.set(options.name, selectedPort)
        }

        callback(null)
      },

      // Set some configurations for extra ports template interpolation
      function(callback) {
        var doing = false
        for(var i = 1; i <= options.extra; i++) {
          var c = grunt.config.get('port-pick-' + i)

          // With multiple tasks, do not find a port that we've already found
          // in a previous task
          if(c)
            continue

          var step = i
          async.waterfall([
            pp.findPort,

            function(selectedPort, callback) {
              if(selectedPort === false)
                grunt.fatal('No available port was found')

              grunt.config.set('port-pick-' + this.step, selectedPort)

              if(step + 1 == options.extra)
                done()
              else
                callback(null)
            }.bind({step: i})
          ]);
        }

        if(!doing)
          done()
      }
    ])
  })
}
