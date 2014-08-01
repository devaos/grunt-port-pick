'use strict'

module.exports = function(grunt) {

  // Load Grunt tasks declared in the package.json file
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  //============================================================================

  grunt.initConfig({

    // Lint.
    jshint: {
      options: {
        asi: true,
        node: true,
        validthis: true,
        loopfunc: true,
        laxcomma: true,
      },
      files: {
        src: ['tasks/**/*.js', '<%= nodeunit.tests %>']
      }
    },

    // Before generating any new files, remove previously-created files.
    clean: {
      coverage: ['coverage'],
      dist: ['coverage', 'node_modules']
    },

    // Specify what ports need to be injected where and what additional ports
    // need to be allotted.
    portPick: {
      options: {
        port: 8760,
        extra: 4
      },
      selenium: {
        targets: [
          'selenium.options.port',
          'protractor.test1.options.args.seleniumPort',
          'protractor.test1.options.args.baseUrl',
          'protractor.test2.options.args.seleniumPort'
        ]
      },
      parallelFuncTest1: {
        options: {
          name: 'port-pick-connect1'
        },
        targets: [
          'connect.test1.port',
        ]
      },
      parallelFuncTest2: {
        options: {
          name: 'port-pick-connect2'
        },
        targets: [
          'connect.test2.port',
        ]
      }
    },

    // Sample selenium runner.  8768 is used if available, otherwise the next
    // available port starting at 8760 will be used.
    selenium: {
      options: {
        port: 8768
      },
    },

    // Sample grunt-connect target to emulate two concurrently running web
    // servers where the ports are dynamically set.
    connect: {
      test1: {
        port: 0
      },
      test2: {
        port: 0
      }
    },

    // Sample grunt-protractor-runner target to emulate two e2e runners hitting
    // the two connect web servers started above.  Shows the port injected into
    // a url object as well as via a templated named config.
    protractor: {
      test1: {
        options: {
          args: {
            seleniumPort: 0,
            baseUrl: 'http://localhost:0'
          }
        }
      },
      test2: {
        options: {
          args: {
            seleniumPort: 0,
            baseUrl: 'http://localhost:<%= grunt.config.get("port-pick-connect2") %>'
          }
        }
      }
    },

    // Sample grunt-karma target to emulate the karma port selection for running
    // unit tests alongside with our e2e tests above, using the "extraPorts"
    // option to have the port available via grunt templates.
    karma: {
      parallel: {
        options: {
          port: '<%= grunt.config.get("port-pick-1") %>'
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['tests/*_test.js']
    },

    // Automate version bumps
    //   grunt release:patch
    //   grunt release:minor
    //   grunt release:major
    release: {
      options: {
        add: false,
        npm: true,
        tagName: 'v<%= version %>',
        commitMessage: 'v<%= version %>',
        tagMessage: 'v<%= version %>'
      }
    }

  })

  grunt.loadTasks('tasks')

  //============================================================================

  grunt.registerTask('testRunSetup', function(){ })

  grunt.registerTask('testRunTearDown', function(){
    var url = require('url'), prop, pass = 0, fail = 0, msg = '', used = {}

    var parsePort = function(val) {
      var n = val

      if(typeof val == 'string' && val.length > 0) {
        var parsed = url.parse(val);

        if(parsed.port && parseInt(parsed.port) == parsed.port) {
          n = parsed.port
        }
      }

      var p = parseInt(n)
      return (p == n && p > 0) ? p : 0
    }

    var validateConfig = function(prop, orig, match) {
      var c = grunt.config.get(prop),
          p = parsePort(c)

      if(match) {
        if(c.match(match)) {
          pass++
          grunt.config.set(prop, orig)
        } else {
          fail++
          if(!msg)
            msg = 'Functional test failed, ' + prop + ' was ' + c
        }
        return
      }
      if(p == 0) {
        fail++
        if(!msg)
          msg = 'Functional test failed, ' + prop + ' was ' + c
      } else if(used[p]) {
        fail++
        if(!msg)
          msg = 'Functional test failed, ' + prop + ' was ' + c +
            ' which was already used'
      } else {
        pass++
        grunt.config.set(prop, orig)
      }
    }

    new Array('portPick.parallelFuncTest1.targets',
     'portPick.parallelFuncTest2.targets').forEach(function(test){
        prop = grunt.config.get(test)

        if(typeof prop !== 'undefined')
          prop.forEach(function(val){
            validateConfig(val, -1, null)
          })
    })

    validateConfig('protractor.test2.options.args.baseUrl',
      'http://localhost:<%= grunt.config.get("port-pick-connect2") %>', /:\d{4}$/)

    validateConfig('karma.parallel.options.port',
      '<%= grunt.config.get("port-pick-1") %>')

    var prev = 0;
    for(var i = 1; i <= 4; ++i) {
      var prop = 'port-pick-' + i
      var extra = grunt.config.get(prop)

      if(!extra) {
        fail++
        if(!msg)
          msg = 'Functional test failed, ' + prop + ' was ' + extra
      } else
        pass++

      if(extra <= prev) {
        fail++
        if(!msg)
          msg = 'Functional test failed, ' + prop + ' was ' + extra + ' <= ' + prev
      } else
        pass++
    }

    if(fail > 0 || pass == 0)
      grunt.fatal(pass + '/' + (pass+fail) + ' functional tests passed' +
        (msg ? (' (' + msg + ')') : ''))

    grunt.log.writeln( '>> '.green + pass + '/' + pass +
      ' functional tests passed')
  })

  //============================================================================

  grunt.registerTask('test', [
    'clean:coverage',
    'jshint',
    'testRunSetup',
    'portPickIndie',
    'portPick:selenium',
    'portPick:parallelFuncTest1',
    'portPick:parallelFuncTest2',
    'testRunTearDown',
    'nodeunit',
    'clean:coverage'
  ])

  grunt.registerTask('default', ['test'])
}
