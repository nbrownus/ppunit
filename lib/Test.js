var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , TestError = require('./TestError')
  , domain = require('domain')
  , ms = require('ms')
  , Date = global.Date
  , setTimeout = global.setTimeout
  , clearTimeout = global.clearTimeout

/**
 * Contains a test function
 * A test can be a beforeEach/All, afterEach/All, or an actual test
 *
 * @param {String} title Title of the test
 * @param {function} func Function to execute for the test
 * @param {String} [type=Test.TYPE.NORMAL] The type of test
 *
 * @constructor
 */
var Test = function (title, func, type) {
    Test.super_.call(this)

    this.id = undefined
    this.title = title
    this.func = func
    this.exclusivity = undefined
    this.parent = undefined
    this.async = func && func.length
    this.state = Test.STATE.WAITING
    this.result = undefined
    this.error = undefined
    this.type = type || Test.TYPE.NORMAL
    this.completedNumber = undefined
    this.failureNumber = undefined

    this._skip = !func
    this._only = false
    this._timeout = undefined
    this._doubleEmitted = false

    this.priorTests = []
    this.nextTests = []
    this._completedPriors = 0
    this._totalPriors = 0

    this.dependencies = []

    this.setMaxListeners(0)
}

util.inherits(Test, EventEmitter)
module.exports = Test

//Constants for test types
module.exports.TYPE = {
    NORMAL: 'normal'
  , BEFORE_EACH: 'beforeEach'
  , AFTER_EACH: 'afterEach'
  , BEFORE_ALL: 'beforeAll'
  , AFTER_ALL: 'afterAll'
  , ROOT: 'root'
}

//Constants for test run states
module.exports.STATE = {
    WAITING: 0
  , RUNNING: 1
  , COMPLETED: 2
}

//Constants for test results
module.exports.RESULT = {
    SUCCESS: 1
  , FAILURE: 2
  , TIMEOUT: 3
  , HOOK_FAILURE: 4
  , SKIPPED: 5
}

//Constants for test exclusivity
module.exports.EXCLUSIVITY = {
    NONE: 0
  , LOCAL: 1
  , GLOBAL: 2
}

/**
 * Gets the full title of this test
 *
 * @param {String} [separator=' '] A separator to use between parents
 *
 * @returns {String} The full title
 */
Test.prototype.fullTitle = function (separator) {
    var parent = this.originalParent || this.parent
    separator = separator || ' '
    var title = (parent) ? parent.fullTitle(separator) + separator : ''
    title += (this.title) ? this.title : ''
    return title
}

/**
 * Getter/setter timeout in milliseconds
 *
 * @param {Number} ms Number of milliseconds to wait before marking timing out
 *
 * @returns {Test|Number} This for chaining if setting, the timeout in ms if getting
 */
Test.prototype.timeout = function (ms) {
    if (!arguments.length) {
        return this._timeout
    }

    this._timeout = ms
    return this
}

/**
 * Getter/setter marks this test to be skipped
 *
 * @returns {Test|Boolean} This for chaining if setting, whether or not this is test will be skipped if getting
 */
Test.prototype.skip = function (skip) {
    if (!arguments.length) {
        return this._skip
    }

    this._skip = skip
    return this
}

/**
 * Getter/setter Marks this test as the only thing that should run
 * All suites/tests marked as only will run, everything else will show as skipped
 *
 * @returns {Test|Boolean} This for chaining if setting, whether or not this is an only test if getting
 */
Test.prototype.only = function (only) {
    if (!arguments.length) {
        return this._only
    }

    this._only = only
    return this
}

/**
 * No other tests can run during a globally exclusive test
 *
 * @returns {Test} This for chaining
 */
Test.prototype.globallyExclusive = function () {
    this.exclusivity = Test.EXCLUSIVITY.GLOBAL
    return this
}

/**
 * No sibling tests can run during a locally exclusive test
 *
 * @returns {Test} This for chaining
 */
Test.prototype.locallyExclusive = function () {
    this.exclusivity = Test.EXCLUSIVITY.LOCAL
    return this
}

/**
 * Any other sibling test that is also a non exclusive test can run together
 *
 * @returns {Test} This for chaining
 */
Test.prototype.nonExclusive = function () {
    this.exclusivity = Test.EXCLUSIVITY.NONE
    return this
}

/**
 * Adds other tests as a prior for this test to run
 *
 * @param {Array.<Test>} priors An array of tests
 */
Test.prototype.addPriorTests = function (priors) {
    var self = this

    if (!priors) {
        return
    }

    priors = (Array.isArray(priors)) ? priors : [priors]

    priors.forEach(function (test) {
        if (self.priorTests.hasOwnProperty(test.id)) {
            return
        }

        test.nextTests.push(self)
        self.priorTests[test.id] = test
        self._totalPriors++

        test.once('finish', function (previous) {
            if (previous) {
                return
            }

            self._completedPriors++
            if (self._isReady()) {
                self.emit('ready')
            }
        })
    })
}

/**
 * Sets an array of tests as dependencies for this test to succeed
 * Used to cascade hook failures
 *
 * @param {Array.<Test>} dependencies An array of tests
 */
Test.prototype.addDependencies = function (dependencies) {
    if (!dependencies) {
        return
    }

    dependencies = (Array.isArray(dependencies)) ? dependencies : [dependencies]
    this.dependencies = this.dependencies.concat(dependencies)
}

/**
 * Clears the timeout timer
 */
Test.prototype.clearTimeout = function () {
    clearTimeout(this.timer)
}

/**
 * Resets the timeout timer
 */
Test.prototype.resetTimeout = function () {
    var self = this

    self.clearTimeout()
    if (this._timeout) {
        this.timer = setTimeout(function () {
            self.complete(new TestError('Timeout of ' + ms(self._timeout) + ' exceeded'), Test.RESULT.TIMEOUT)
        }, self._timeout)
    }
}

/**
 * Clones the test
 * Title, function, timeout, skip, only, exclusivity, and parent is shallow copied over
 *
 * @returns {Test} The cloned test
 */
Test.prototype.clone = function () {
    var test = new Test(this.title, this.func)

    test.timeout(this.timeout())
    test.skip(this._skip)
    test.only(this._only)
    test.exclusivity = this.exclusivity
    test.parent = this.parent
    test.type = this.type
    test.originalParent = this.parent

    return test
}

/**
 * Executes the test if all prior tests have completed
 */
Test.prototype.run = function () {
    if (!this._isReady()) {
     //   return
    }

    var self = this
      , context = self.parent.context()

    self.dependencies.some(function (test) {
        if (test.result === Test.RESULT.FAILURE || test.result === Test.RESULT.TIMEOUT) {
            //TODO: Better errors, which hook type?
            self.complete(new TestError(test.fullTitle('/') + ' dependency failed'), Test.RESULT.HOOK_FAILURE)
            return true
        }
    })

    if (self.state !== Test.STATE.WAITING) {
        return
    }

    self.domain = domain.create()
    self.startTime = Date.now()

    if (self._skip) {
        return self.complete(undefined, Test.RESULT.SKIPPED)
    }

    self.domain.on('error', function (error) {
        self.complete(error)
    })

    self.emit('start')

    self.domain.run(function () {
        self.resetTimeout()
        self.state = Test.STATE.RUNNING

        try {
            var returnValue = self.func.call(
                context
              , function (error) {
                    self.complete(error)
                }
            )
        } catch (error) {
            return self.complete(error)
        }

        if (self._handlePromise(returnValue)) {
            return
        }

        if (returnValue instanceof Error) {
            return self.complete(returnValue)
        } else if (!self.async) {
            return self.complete()
        }
    })
}

/**
 * Completes the test
 *
 * @param {*} [error] An error, if there was one, to record for the test
 * @param {Number} [result] An override to the normal result value. Useful for timeout, skip, etc
 */
Test.prototype.complete = function (error, result) {
    var self = this
      , duration = (new Date - this.startTime) || 0
      , previous
      , testError

    if (self.state === Test.STATE.COMPLETED) {
        //Get out if we already handled a 2nd completion or the previous completion was an error
        if (self._doubleEmitted || self.result === Test.RESULT.FAILURE) {
            return
        }

        self._doubleEmitted = true

        previous = {
            result: self.result
          , error: self.error
          , duration: self.duration
        }

        if (self.result === Test.RESULT.TIMEOUT) {
            if (!error) {
                error = new TestError(
                    'Timeout of ' + ms(self._timeout) + ' exceeded, eventually succeeded after ' + ms(duration)
                )

                result = self.result
            } else {
                testError = new TestError(
                    'Timeout of ' + ms(self._timeout) + ' exceeded, eventually failed after ' + ms(duration)
                )

                testError.addError(error)
                error = testError
                result = self.result
            }
        } else {
            error = new TestError('done() called multiple times')
        }
    }

    if (error) {
        self.error = TestError.convert(error)
        result = result || Test.RESULT.FAILURE
    } else {
        result = result || Test.RESULT.SUCCESS
    }

    self.result = result
    self.state = Test.STATE.COMPLETED
    self.clearTimeout()
    self.duration = duration

    self.emit('finish', previous)
}

/**
 * Checks the return value from running the test for a promise and handles it if necessary
 *
 * @param {*} returnValue The return value of the test function
 *
 * @returns {boolean} True if the tests return value was a promise, false if not
 *
 * @private
 */
Test.prototype._handlePromise = function (returnValue) {
    var self = this

    if (typeof returnValue !== 'object' || returnValue === null || typeof returnValue.then !== 'function') {
        return false
    }

    returnValue.then(
        function () {
            self.complete()
        }
      , function (reason) {
            if (reason === null || reason === undefined) {
                reason = new TestError('Promise rejected with no rejection reason.')
            }

            self.complete(reason)
        }
    )

    return true
}

/**
 * Checks whether or not the test is ready to run
 *
 * @returns {boolean} True if ready, false if not
 *
 * @private
 */
Test.prototype._isReady = function () {
    return this._completedPriors === this._totalPriors
}

/**
 * Helper to create a Root test
 * Root tests are used to tie in multiple tests
 *
 * @param {String} title Test title
 *
 * @returns {Test} The Root test
 */
Test.newRoot = function (title) {
    return new Test(title, function () {}, Test.TYPE.ROOT)
}

/**
 * Helper to create a beforeEach
 * beforeEachs are run before every test within a suites ancestry
 *
 * @param {String} title Title of the test
 * @param {function} func Function to execute for the test
 *
 * @returns {Test} the beforeEach test
 */
Test.newBeforeEach = function (title, func) {
    return new Test(title, func, Test.TYPE.BEFORE_EACH)
}

/**
 * Helper to create a beforeAll
 * beforeAll are run before all tests within a suites ancestry
 *
 * @param {String} title Title of the test
 * @param {function} func Function to execute for the test
 *
 * @returns {Test} the beforeAll test
 */
Test.newBeforeAll = function (title, func) {
    return new Test(title, func, Test.TYPE.BEFORE_ALL)
}

/**
 * Helper to create a afterEach
 * afterEach are run after every test within a suites ancestry
 *
 * @param {String} title Title of the test
 * @param {function} func Function to execute for the test
 *
 * @returns {Test} the afterEach test
 */
Test.newAfterEach = function (title, func) {
    return new Test(title, func, Test.TYPE.AFTER_EACH)
}

/**
 * Helper to create an afterAll
 * afteralls are run after all tests within a suites ancestry
 *
 * @param {String} title Title of the test
 * @param {function} func Function to execute for the test
 *
 * @returns {Test} the afterAll test
 */
Test.newAfterAll = function (title, func) {
    return new Test(title, func, Test.TYPE.AFTER_ALL)
}
