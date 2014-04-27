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
      url = require('url'),
      async = require('async'),
      portscanner = require('portscanner'),
      used = [],
      pp = this

  this.options = defaults
  this.first = false
  this.last = false
  this.usePorts = false
  this.tryPorts = []

  // Don't exceed the maximum port when scanning for an available one
  this.findPortLimit = function(start, limit) {
    if(limit === false || start + limit > 65535) {
      limit = Math.max(0, 65535 - start)

      if(grunt.option('verbose')) {
        grunt.log.writeln('Options: ' + ('limit=' + limit).cyan)
      }
    }

    return limit
  }

  // Check to see if a specific port is available
  this.checkPort = function(port, callback) {
    portscanner.checkPortStatus(port, pp.options.hostname,
      function(error, status) {
        if(status === 'closed')
          callback(port)
        else
          callback()
      }
    )
  }

  // Find an available port or bail if none is found
  this.findPort = function(callback) {
    async.series([
      function(callback){
        async.eachSeries(pp.tryPorts, pp.checkPort, function(foundPort) {
          callback(foundPort)
        })
      },
      function(callback){
        if(pp.usePorts && pp.usePorts.length > 0) {
          var foundPort = pp.usePorts.shift()
          pp.first = foundPort + 1
          used.push(foundPort)
          grunt.config.set('port-pick-used', used.join(','))
          callback(foundPort)
        } else {
          callback()
        }
      },
      function(callback){
        portscanner.findAPortNotInUse(pp.first, pp.last, pp.options.hostname,
          function(error, foundPort) {
            // If we use a port, increment so that it isn't used again
            if(foundPort !== false) {
              pp.first = foundPort + 1
              used.push(foundPort)
              grunt.config.set('port-pick-used', used.join(','))
            }

            callback(foundPort)
          }
        )
      }
    ], function (foundPort) {
      callback(null, foundPort)
    })
  }

  // Inject the selected port into a configuration
  this.injectPort = function(prop, selectedPort) {
    var oldVal = grunt.config.get(prop)
    var newVal = selectedPort

    if(typeof oldVal == 'string' && oldVal.length > 0) {
      var parsed = url.parse(oldVal);

      if(parsed.port && parseInt(parsed.port) == parsed.port) {
        parsed.host = null
        parsed.port = selectedPort
        newVal = url.format(parsed)
      }
    }

    grunt.config.set(prop, newVal)
    grunt.log.writeln( '>> '.green + prop + '=' + newVal)
  }

  //============================================================================

  grunt.registerMultiTask('portPick',
    'Scan and pick an available port, for other grunt tasks', function() {

    var done = this.async(),
        self = this,
        newopts = false,
        tmpopts = this.options(defaults)

    if(pp.options.port != tmpopts.port || pp.options.limit != tmpopts.limit)
      newopts = true

    pp.options = tmpopts

    //==========================================================================

    if(newopts) {
      pp.first = pp.options.port
      pp.last = pp.first + pp.findPortLimit(pp.options.port, pp.options.limit)
    } else {
      pp.first = pp.first ? pp.first : pp.options.port
      pp.last = pp.last ? pp.last : pp.first +
        pp.findPortLimit(pp.options.port, pp.options.limit)
    }

    if(!this.data || !(this.data instanceof Object)) {
      this.data = {}
    }

    if(!this.data.targets || !(this.data.targets instanceof Array)) {
      this.data.targets = []
    }

    if(!pp.usePorts) {
      var ports = grunt.option('portPickUsePorts')

      if(ports) {
        pp.usePorts = ports.split(',')
      }
    }

    self.data.targets.forEach(function(prop) {
      var val = grunt.config.get(prop)

      if(parseInt(val) > 0) {
        pp.tryPorts.push(parseInt(val))
      } else if(typeof val == 'string' && val.length > 0) {
        var parsed = url.parse(val);
        if(parsed.port && parseInt(parsed.port) > 0) {
          pp.tryPorts.push(parseInt(val))
        }
      }
    })

    //==========================================================================

    async.waterfall([
      pp.findPort,

      // Override the configurations we were told to override
      function(selectedPort, callback) {
        if(selectedPort === false)
          grunt.fatal('No available port was found')

        self.data.targets.forEach(function(prop) {
          pp.injectPort(prop, selectedPort)
        })

        if(pp.options.name) {
          pp.injectPort(pp.options.name, selectedPort)
        }

        callback(null)
        return
      },

      // Set some configurations for extra ports template interpolation
      function(callback) {
        pp.tryPorts = []
        var doing = false
        for(var i = 1; i <= pp.options.extra; i++) {
          var c = grunt.config.get('port-pick-' + i)

          // With multiple tasks, do not find a port that we've already found
          // in a previous task
          if(c) {
            if(step + 1 >= pp.options.extra && !doing)
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

              if(step + 1 >= pp.options.extra) {
                done()
              }
              else {
                callback(null)
                return
              }
            }.bind({step: i})
          ])
        }

        if(!doing) {
          done()
          return
        }
      }
    ])
  })
}
