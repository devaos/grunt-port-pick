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
        loopfunc: true
      },
      files: {
        src: ['tasks/**/*.js','<%= nodeunit.tests %>']
      }
    },

    // Before generating any new files, remove previously-created files.
    clean: {
      coverage: ['coverage'],
      dist: ['coverage', 'node_modules']
    },

    // Configuration to be run and then tested.
    portPick: {
      options: {
        port: 7654,
        extra: 1
      },
      selenium: {
        targets: [
          'selenium.options.port',
          'protractor.test1.args.seleniumPort',
          'protractor.test2.args.seleniumPort'
        ]
      },
      concurrentFuncTest1: {
        options: {
          name: 'port-pick-connect1'
        },
        targets: [
          'connect.test1.port',
        ]
      },
      concurrentFuncTest2: {
        options: {
          name: 'port-pick-connect2'
        },
        targets: [
          'connect.test2.port',
        ]
      }
    },

    // Sample selenium runner.
    selenium: {
      options: {
        port: -1
      },
    },

    // Sample grunt-connect target to emulate two concurrently running web
    // servers where the ports are dynamically set.
    connect: {
      test1: {
        port: -1
      },
      test2: {
        port: -1
      }
    },

    // Sample grunt-protractor-runner target to emulate two e2e runners hitting
    // the two connect web servers started above.
    protractor: {
      test1: {
        options: {
          args: {
            seleniumPort: -1,
            baseUrl: 'http://localhost:<%= grunt.config.get("port-pick-connect1") %>'
          }
        }
      },
      test2: {
        options: {
          args: {
            seleniumPort: -1,
            baseUrl: 'http://localhost:<%= grunt.config.get("port-pick-connect2") %>'
          }
        }
      }
    },

    // Sample grunt-karma target to emulate the karma port selection for running
    // unit tests alongside with our e2e tests above, using the "extraPorts"
    // option to have the port available via grunt templates.
    karma: {
      concurrent: {
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
    var prop, pass = 0, fail = 0, msg = '', used = {}

    var validateConfig = function(prop, orig, match) {
      var c = grunt.config.get(prop)
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
      var p = parseInt(c)
      if(p != c || p <= 0) {
        fail++
        if(!msg)
          msg = 'Functional test failed, ' + prop + ' was ' + c
      } else if(used[c]) {
        fail++
        if(!msg)
          msg = 'Functional test failed, ' + prop + ' was ' + c +
            ' which was already used'
      } else {
        pass++
        grunt.config.set(prop, orig)
      }
    }

    new Array('portPick.concurrentFuncTest1.targets',
     'portPick.concurrentFuncTest2.targets').forEach(function(test){
        prop = grunt.config.get(test)

        if(typeof prop !== 'undefined')
          prop.forEach(function(val){
            validateConfig(val, -1, null)
          })
    })

    validateConfig('protractor.test1.options.args.baseUrl',
      'http://localhost:<%= grunt.config.get("port-pick-connect1") %>', /:\d{4}$/)

    validateConfig('protractor.test2.options.args.baseUrl',
      'http://localhost:<%= grunt.config.get("port-pick-connect2") %>', /:\d{4}$/)

    validateConfig('karma.concurrent.options.port',
      '<%= grunt.config.get("port-pick-1") %>')

    if(fail > 0 || pass == 0)
      grunt.fatal(pass + '/' + (pass+fail) + ' functional tests passed' +
        (msg ? (' (' + msg + ')') : ''))

    grunt.log.writeln( '>> '.green + pass + '/' + pass +
      ' functional tests passed')
  })

  //============================================================================

  grunt.registerTask('test', [
    'clean:coverage',
    'testRunSetup',
    'portPick:selenium',
    'portPick:concurrentFuncTest1',
    'portPick:concurrentFuncTest2',
    'testRunTearDown',
    'nodeunit',
    'clean:coverage'
  ])

  grunt.registerTask('default', ['jshint', 'test'])
}
