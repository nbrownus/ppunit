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
var PPUnit = function (options) {
    var self = this

    PPUnit.super_.call(self)

    options = options || {}
    self.concurrency = options.concurrency || -1

    self.rootSuite = new Suite(undefined)
    self.rootSuite.timeout(2000)
    self.rootSuite.globallyExclusive()
    self.rootSuite.locallyExclusiveTests()

    self.allTests = []
    self.failures = []
    self.tickId = 0

    self.stats = {
        suites: 0
      , tests: 0
      , skipped: 0
      , passes: 0
      , failures: 0
      , completed: 0
      , startTime: 0
      , maxConcurrency: 0
      , currentlyRunning: 0
      , end: undefined
      , duration: undefined
    }

    self._queue = []
    self._nextId = 1
    self._files = []
    self._bailing = false

    process.on('SIGINT', function () {
        self._bail()
    })
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

    self._queue.push(self.allTests[0])
    self._nextTest()
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

    newTest.on('ready', function () {
        if (self._bailing) {
            return
        }

        self._queue.push(newTest)
        self._nextTest()
    })

    newTest.on('start', function () {
        self.emit('test start', newTest)
    })

    newTest.on('finish', function (previous) {
        if (!previous) {
            newTest.tickEnd = ++self.tickId
            self.stats.currentlyRunning--
        }

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
        self._nextTest()
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

/**
 * Attempts to run the next ready test
 * Depending on the concurrency limit, many tests may be running at the same time
 *
 * @private
 */
PPUnit.prototype._nextTest = function () {
    var self = this
    process.nextTick(function () {
        if (self._queue.length > 0 && (self.concurrency < 1 || self.stats.currentlyRunning < self.concurrency)) {
            var test = self._queue.shift()
            test.tickStart = self.tickId++
            self.stats.currentlyRunning++
            self.stats.maxConcurrency = Math.max(self.stats.maxConcurrency, self.stats.currentlyRunning)

            test.run()

            self._nextTest()
        }
    })
}

/**
 * Stops the run and marks remaining tests as skipped
 *
 * @private
 */
PPUnit.prototype._bail = function () {
    var self = this
    self._bailing = true
    self._queue = []

    self.allTests.forEach(function (test, index) {
        if (test.state === Test.STATE.COMPLETED || index === (self.allTests.length - 1)) {
            return
        }

        if (test.type !== Test.TYPE.ROOT) {
            test.complete(void 0, Test.RESULT.SKIPPED)
        } else {
            test.complete(void 0, Test.RESULT.SUCCESS)
        }
    })

    self._queue.push(self.allTests[self.allTests.length - 1])
    self._nextTest()
}
