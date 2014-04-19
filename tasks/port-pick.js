/**
 * Copyright (c) 2014 Ari Aosved
 * http://github.com/devaos/grunt-port-pick/blob/master/LICENSE
 */

'use strict';

module.exports = function(grunt) {

  var defaults = {
        port: 8765,
        limit: false,
        extra: 0,
        hostname: '0.0.0.0',
        name: ''
      },
      portscanner = require('portscanner'),
      options = defaults,
      used = [],
      usePorts = [],
      pp = this

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
    if(usePorts.length > 0) {
      var foundPort = usePorts.shift()
      used.push(foundPort)
      grunt.config.set('port-pick-used', used.join(','))

      if(typeof callback === 'function') {
        callback(null, foundPort)
        return
      }
      else
        return foundPort
    }

    portscanner.findAPortNotInUse(options.port + used.length,
      options.port + options.limit, options.hostname,
      function(error, foundPort) {
        // If we use a port, increment so that it isn't used again
        if(foundPort !== false) {
          used.push(foundPort)
          grunt.config.set('port-pick-used', used.join(','))
        }

        if(typeof callback === 'function') {
          callback(null, foundPort)
          return
        }
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

    options = this.options(defaults)

    //==========================================================================

    options.limit = pp.findPortLimit(options.port + used.length, options.limit)

    if(!this.data || !(this.data instanceof Object)) {
      this.data = {}
    }

    if(!this.data.targets || !(this.data.targets instanceof Array)) {
      this.data.targets = []
    }

    var ports = grunt.option('portPickUsePorts')

    if(ports) {
      usePorts = ports.split(',')
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
          grunt.log.writeln( '>> '.green + prop + '=' + selectedPort)
        })

        if(options.name) {
          grunt.config.set(options.name, selectedPort)
          grunt.log.writeln( '>> '.green + options.name + '=' + selectedPort)
        }

        callback(null)
        return
      },

      // Set some configurations for extra ports template interpolation
      function(callback) {
        var doing = false
        for(var i = 1; i <= options.extra; i++) {
          var c = grunt.config.get('port-pick-' + i)

          // With multiple tasks, do not find a port that we've already found
          // in a previous task
          if(c) {
            if(step + 1 >= options.extra && !doing)
              done()
            continue
          }
          else
            doing = true

          var step = i
          async.waterfall([
            pp.findPort,

            function(selectedPort, callback) {
              if(selectedPort === false)
                grunt.fatal('No available port was found')

              grunt.config.set('port-pick-' + this.step, selectedPort)
              grunt.log.writeln( '>> '.green + 'port-pick-' + this.step + '=' +
                selectedPort)

              if(step + 1 >= options.extra) {
                done()
              }
              else {
                callback(null)
                return
              }
            }.bind({step: i})
          ]);
        }

        if(!doing) {
          done()
          return
        }
      }
    ])
  })
}
