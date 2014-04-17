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

    if(!this.data || !(this.data instanceof Array)) {
      this.data = []
    }

    //==========================================================================

    async.waterfall([
      pp.findPort,

      // Override the configurations we were told to override
      function(selectedPort, callback) {
        if(selectedPort === false)
          grunt.fatal('No available port was found')

        self.data.forEach(function(prop) {
          grunt.config.set(prop, selectedPort)
        })
        callback(null)
      },

      // Set some configurations for extra ports template interpolation
      function(callback) {
        if(options.extra == 0)
          done()

        for(var i = 0; i < options.extra; i++) {
          var step = i
          async.waterfall([
            pp.findPort,

            function(selectedPort, callback) {
              if(selectedPort === false)
                grunt.fatal('No available port was found')

              grunt.config.set('open-port-' + this.step, selectedPort)

              if(step + 1 == options.extra)
                done()
              else
                callback(null)
            }.bind({step: i})
          ]);
        }
      }
    ])
  })
}
