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
        port: 8000,
        extra: 1
      },
      concurrentFuncTest1: [
        'connect.test1.port',
        'protractor.test1.args.seleniumPort'
      ],
      concurrentFuncTest2: [
        'connect.test2.port',
        'protractor.test2.args.seleniumPort'
      ]
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
            seleniumPort: -1
          }
        }
      },
      test2: {
        options: {
          args: {
            seleniumPort: -1
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
          port: '<%= grunt.config.get("open-port-0") %>'
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['tests/*_test.js']
    }

  })

  grunt.loadTasks('tasks')

  //============================================================================

  grunt.registerTask('testRunSetup', function(){ })

  grunt.registerTask('testRunTearDown', function(){
    var prop, pass = 0, fail = 0, msg = '', used = {}

    var validateConfig = function(prop, orig) {
      var c = grunt.config.get(prop)
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

    new Array('portPick.concurrentFuncTest1',
     'portPick.concurrentFuncTest2').forEach(function(test){
        prop = grunt.config.get(test)

        if(typeof prop !== 'undefined')
          prop.forEach(function(val){
            validateConfig(val, -1)
          })
    })

    validateConfig('karma.concurrent.options.port',
      '<%= grunt.config.get("open-port-0") %>')

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
    'portPick',
    'testRunTearDown',
    'nodeunit',
    'clean:coverage'
  ])

  grunt.registerTask('default', ['jshint', 'test'])
}
