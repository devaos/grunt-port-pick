#grunt-port-pick
[![Build Status](https://travis-ci.org/devaos/grunt-port-pick.svg?branch=master)](https://travis-ci.org/devaos/grunt-port-pick) [![Dependency Status](https://david-dm.org/devaos/grunt-port-pick.svg?theme=shields.io)](https://david-dm.org/devaos/grunt-port-pick) [![devDependency Status](https://david-dm.org/devaos/grunt-port-pick/dev-status.svg?theme=shields.io)](https://david-dm.org/devaos/grunt-port-pick#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/devaos/grunt-port-pick/badge.png)](https://coveralls.io/r/devaos/grunt-port-pick)

##Installation

Install npm package:

```bash
npm install grunt-port-pick --save-dev
```

Add the following to your project's `Gruntfile` in order to load the task:

```js
grunt.loadNpmTasks('grunt-port-pick');
```

##Usage Examples

Tired of manually configuring ports only to have them conflict?  This task will scan for an unused port, given a range, and swap in the unused port into other tasks' configurations.

###Target the port configuration:

```js
// Project configuration.
grunt.initConfig({
  portPick: {
    options: {
      port: 8765,
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
  // unit tests alongside with our e2e tests above, using the "extra" option
  // to have the port available via grunt templates.
  karma: {
    concurrent: {
      options: {
        port: '<%= grunt.config.get("open-port-0") %>'
      }
    }
  }

  concurrent: {
    tests: ['unit', 'e2e1', 'e2e2']
  }
});

grunt.registerTask('e2e1', [ 'portPick:concurrentFuncTest1', 'connect:test1', 'protractor:test1' ]);
grunt.registerTask('e2e2', [ 'portPick:concurrentFuncTest1', 'connect:test2', 'protractor:test2' ]);
grunt.registerTask('unit', [ 'portPick', 'karma:concurrent' ]);

grunt.registerTask('tests', [ 'concurrent:tests' ]);
```

##Options

1. `port` -- The port to start scanning from, inclusive, for the first available port to use, defaults to 8765.
2. `limit` -- Do not scan for a port after this one, fail if one is not found between `port` and `limit`, defaults to false (unlimited).
3. `extra` -- Set this number of open-port-# configurations for use by other tasks, defaults to 0.
4. `hostname` -- The hostname to bind to, defaults to 0.0.0.0 (all interfaces).
