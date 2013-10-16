var Suite = require('./Suite')
  , Test = require('./Test')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , path = require('path')
  , Date = global.Date


/**
 * Creates a new PPUnit object
 *
 * @constructor
 */
var PPUnit = function () {
    PPUnit.super_.call(this)

    this.rootSuite = new Suite(undefined)
    this.rootSuite.timeout(2000)
    this.rootSuite.globallyExclusive()
    this.rootSuite.locallyExclusiveTests()

    this.allTests = []

    this._nextId = 1

    this._files = []

    this.failures = []

    this.stats = {
        suites: 0
      , tests: 0
      , skipped: 0
      , passes: 0
      , failures: 0
      , completed: 0
      , startTime: 0
      , end: undefined
      , duration: undefined
    }
}

util.inherits(PPUnit, EventEmitter)
module.exports = PPUnit

/**
 * Adds a file that contains tests to be run
 *
 * @param {String} file Path to the file
 */
PPUnit.prototype.addFile = function (file) {
    this._files.push(path.resolve(file))
}

/**
 * Runs the test suites
 *
 * @param {function} callback A function to call after finish is emitted
 */
PPUnit.prototype.run = function (callback) {
    this._loadFiles()

    var self = this

    self.rootSuite.on('test', function (test) {
        self._addTest(test)
    })

    self.rootSuite.on('suite', function (suite) {
        suite.id = self._nextId++
    })

    self.rootSuite.prepare()

    self.stats.startTime = new Date
    self.emit('start')

    self.allTests[self.allTests.length - 1].on('finish', function () {
        self.stats.end = new Date
        self.stats.duration = new Date - self.stats.startTime

        self.emit('finish')
        callback()
    })

    self.allTests[0].run()
}

/**
 * Loads/requires the files and builds the test suites
 *
 * @private
 */
PPUnit.prototype._loadFiles = function () {
    var self = this

    self._files.forEach(function (file) {
        //TODO: Emit pre-require and require
        require(file)
    })
}

/**
 * Adds a test to the list and wires up events
 *
 * @param {Test} newTest The test to add
 */
PPUnit.prototype._addTest = function (newTest) {
    var self = this

    newTest.id = this._nextId++
    if (newTest.type !== Test.TYPE.ROOT) {
        self.stats.tests++
    }

    newTest.on('start', function () {
        self.emit('test start', newTest)
    })

    newTest.on('finish', function (previous) {
        if (newTest.type !== Test.TYPE.ROOT) {
            if (!newTest.completedNumber) {
                newTest.completedNumber = ++self.stats.completed
            }

            switch (newTest.result) {
                case Test.RESULT.SUCCESS:
                    self.stats.passes++
                    break

                case Test.RESULT.HOOK_FAILURE:
                case Test.RESULT.TIMEOUT:
                case Test.RESULT.FAILURE:
                    if (previous && previous.result === Test.RESULT.SUCCESS) {
                        self.stats.passes--
                    }

                    if (!previous || previous.result === Test.RESULT.SUCCESS) {
                        self.failures.push(newTest)
                        self.stats.failures++
                        newTest.failureNumber = self.stats.failures
                    }

                    break

                case Test.RESULT.SKIPPED:
                    self.stats.skipped++
                    break
            }
        }

        self.emit('test finish', newTest, previous)
    })

    newTest.on('error', function (error) {
        console.error('Test had an error', error)
        self.emit('test error', newTest, error)
    })

    if (newTest.exclusivity === Test.EXCLUSIVITY.GLOBAL) {
        var edges = []

        this.allTests.forEach(function (test) {
            if (test.nextTests.length) {
                return
            }

            edges.push(test)
        })

        newTest.addPriorTests(edges)
    }

    this.allTests.push(newTest)
}
