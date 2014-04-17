#grunt-portpick
[![Build Status](https://travis-ci.org/devaos/grunt-portpick.svg?branch=master)](https://travis-ci.org/devaos/grunt-portpick) [![Dependency Status](https://david-dm.org/devaos/grunt-portpick.svg?theme=shields.io)](https://david-dm.org/devaos/grunt-portpick) [![devDependency Status](https://david-dm.org/devaos/grunt-portpick/dev-status.svg?theme=shields.io)](https://david-dm.org/devaos/grunt-portpick#info=devDependencies) [![Coverage Status](http://img.shields.io/coveralls/devaos/grunt-portpick/master.svg)](https://coveralls.io/r/devaos/grunt-portpick)

##Installation

Install npm package:

```bash
npm install grunt-portpick --save-dev
```

Add the following to your project's `Gruntfile` in order to load the task:

```js
grunt.loadNpmTasks('grunt-portpick');
```

##Usage Examples

Tired of manually configuring ports only to have them conflict?  This task will scan for an unused port, given a range, and swap in the unused port into other tasks' configurations.

###Target the port configuration:

```js
// Project configuration.
grunt.initConfig({
  portpick: {
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

grunt.registerTask('e2e1', [ 'portpick:concurrentFuncTest1', 'connect:test1', 'protractor:test1' ]);
grunt.registerTask('e2e2', [ 'portpick:concurrentFuncTest1', 'connect:test2', 'protractor:test2' ]);
grunt.registerTask('unit', [ 'portpick', 'karma:concurrent' ]);

grunt.registerTask('tests', [ 'concurrent:tests' ]);
```

##Options

1. `port` -- The port to start scanning from, inclusive, for the first available port to use.
2. `limit` -- Do not scan for a port after this one, fail if one is not found between `port` and `limit`.
3. `extra` -- Set this number of open-port-# configurations for use by other tasks
