var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , Test = require('./Test')

/**
 * Contains a set of tests and children suites
 *
 * @param {String} title Title for the suite
 *
 * @constructor
 */
var Suite = function (title) {
    Suite.super_.call(this)

    this.title = title
    this.suites = []
    this.exclusivity = Suite.EXCLUSIVITY.NONE
    this.testExclusivity = undefined
    this.parent = undefined
    this.nextTests = []
    this.globalTests = []
    this.testContainer = false
    this.testDependencies = []

    this.hasOnlyTest = false

    this._only = false
    this._skip = false
    this._timeout = undefined
    this._prepared = false
    this._nonExclusives = []
    this._context = undefined

    this.tests = {
        beforeAll: []
      , beforeEach: []
      , normal: []
      , afterEach: []
      , afterAll: []
    }
}

util.inherits(Suite, EventEmitter)
module.exports = Suite

//Constants for suite exclusivity
module.exports.EXCLUSIVITY = {
    NONE: 0
  , LOCAL: 1
  , GLOBAL: 2
}

/**
 * Gets the full title of this suite
 *
 * @param {String} [separator=' '] A separator to use between parents
 *
 * @returns {String} The full title
 */
Suite.prototype.fullTitle = function (separator) {
    var title

    separator = separator || ' '
    if (!this.testContainer) {
        title = (this.parent) ? this.parent.fullTitle(separator) + separator : ''
        title += (this.title) ? this.title : ''
    } else {
        title = (this.parent) ? this.parent.fullTitle(separator) : ''
    }

    return title
}

/**
 * Adds a child suite under the current suite
 *
 * @param {Suite} suite The suite to add as a child
 */
Suite.prototype.addSuite = function (suite) {
    suite.parent = this
    this.suites.push(suite)
}

/**
 * Adds a test under the current suite
 *
 * @param {Test} test The test to add
 */
Suite.prototype.addTest = function (test) {
    test.parent = this
    this.tests.normal.push(test)
}

/**
 * Adds a before all hook that will run before all tests in this suite
 *
 * @param {Test} beforeAll The Test to add as a beforeAll
 */
Suite.prototype.addBeforeAll = function (beforeAll) {
    beforeAll.parent = this
    this.tests.beforeAll.push(beforeAll)
}

/**
 * Adds an after all hook that will run after all tests in this suite
 *
 * @param {Test} afterAll The Test to add as an afterAll
 */
Suite.prototype.addAfterAll = function (afterAll) {
    afterAll.parent = this
    this.tests.afterAll.push(afterAll)
}

/**
 * Adds a before each hook that will run before every Test in this suite and all child suites
 *
 * @param {Test} beforeEach The Test to add as a beforeEach
 */
Suite.prototype.addBeforeEach = function (beforeEach) {
    beforeEach.parent = this
    this.tests.beforeEach.push(beforeEach)
}

/**
 * Adds an after each hook that will run after every Test in this suite and all child suites
 *
 * @param {Test} afterEach The Test to add as an afterEach
 */
Suite.prototype.addAfterEach = function (afterEach) {
    afterEach.parent = this
    this.tests.afterEach.push(afterEach)
}

/**
 * No other suites can run during a globally exclusive suite
 *
 * @returns {Suite} This for chaining
 */
Suite.prototype.globallyExclusive = function () {
    this.exclusivity = Suite.EXCLUSIVITY.GLOBAL
    return this
}

/**
 * No sibling suites can run during a locally exclusive suite
 *
 * @returns {Suite} This for chaining
 */
Suite.prototype.locallyExclusive = function () {
    this.exclusivity = Suite.EXCLUSIVITY.LOCAL
    return this
}

/**
 * Sets that all tests within this suite and children suites should default to globally exclusive
 *
 * @returns {Suite} This for chaining
 */
Suite.prototype.globallyExclusiveTests = function () {
    this.testExclusivity = Test.EXCLUSIVITY.GLOBAL
    return this
}

/**
 * Sets that all tests within this suite and children suites should default to locally exclusive
 *
 * @returns {Suite} This for chaining
 */
Suite.prototype.locallyExclusiveTests = function () {
    this.testExclusivity = Test.EXCLUSIVITY.LOCAL
    return this
}

/**
 * Sets that all tests within this suite and children suites should default to non exclusive
 *
 * @returns {Suite} This for chaining
 */
Suite.prototype.nonExclusiveTests = function () {
    this.testExclusivity = Test.EXCLUSIVITY.NONE
    return this
}

/**
 * Getter/setter Marks this suite and all tests underneath it as the only things that should run
 * All suites/tests marked as only will run, everything else will show as skipped
 *
 * @returns {Test|Boolean} This for chaining if setting, whether or not this is an only suite if getting
 */
Suite.prototype.only = function (only) {
    if (!arguments.length) {
        return this._only
    }

    this._only = only
    return this
}

/**
 * Getter/setter default timeout for suites and tests under this suite
 *
 * @param {Number} ms Number of milliseconds to wait before marking a test as timed out
 *
 * @returns {Suite} This for chaining
 */
Suite.prototype.timeout = function (ms) {
    if (!arguments.length) {
        return this._timeout
    }

    this._timeout = ms
    return this
}

/**
 * Getter/setter marks this suite to be skipped
 *
 * @returns {Suite|Boolean} This for chaining if setting, whether or not this is test will be skipped if getting
 */
Suite.prototype.skip = function (skip) {
    if (!arguments.length) {
        return this._skip
    }

    this._skip = skip
    return this
}

/**
 * Gets the context that tests under this suite should run in
 * Shallow copies the parent context
 *
 * @return {Object} the context to run tests in
 */
Suite.prototype.context = function () {
    if (!this._context) {
        if (this.testContainer) {
            this._context = this.parent.context()
        } else if (this.parent) {
            this._context = util._extend({}, this.parent.context())
        } else {
            this._context = {}
        }
    }

    return this._context
}

/**
 * Prepares the tests to be run
 * Skips things not marked as only if anything is marked as only. Timeouts are set from suite to test.
 * BeforeAlls, afterAlls, beforeEachs, and afterEachs are cloned into each test
 */
Suite.prototype.prepare = function () {
    var self = this
      , hasOnly

    if (self._prepared) {
        return
    }

    self.hasOnlyTest = self.hasOnly(Test.TYPE.NORMAL)

    //Get a global lock if we need it
    if (self.exclusivity === Suite.EXCLUSIVITY.GLOBAL) {
        var suiteStart = Test.newRoot('Global exclusive start')
        suiteStart.parent = self
        suiteStart.globallyExclusive()
        self.nextTests = [suiteStart]
        self.emit('test', suiteStart)
    }

    //Run the beforeAlls
    if (self.tests.beforeAll.length) {
        hasOnly = self.hasOnly(Test.TYPE.BEFORE_ALL)
        self.tests.beforeAll.forEach(function (test) {
            self._setTestProperties(test, hasOnly)
            test.addDependencies(self.testDependencies)
            self.testDependencies.push(test)
        })
        self._closeNonExclusives()
    }

    //Run the actual tests, giving them every beforeEach and afterEach
    if (self.tests.normal.length) {
        var testSuites = []
        self.tests.normal.forEach(function (test) {
            if (!self.tests.beforeEach.length && !self.tests.afterEach.length) {
                self._setTestProperties(test, self.hasOnlyTest)
                return
            }

            var testSuite = self._createTestContainer(test)
            testSuites.push(testSuite)
        })

        if (!testSuites.length) {
            self._closeNonExclusives()
        } else {
            self._prepareSuites(testSuites)
        }
    }

    //Build up all child suites
    self._prepareSuites(self.suites)

    //Run the afterAlls
    if (self.tests.afterAll.length) {
        hasOnly = self.hasOnly(Test.TYPE.AFTER_ALL)
        self.tests.afterAll.forEach(function (test) {
            self._setTestProperties(test, hasOnly)
        })
        self._closeNonExclusives()
    }

    //Release the global lock if we had one
    if (self.exclusivity === Suite.EXCLUSIVITY.GLOBAL) {
        var suiteEnd = Test.newRoot('Global exclusive finish')
        suiteEnd.parent = self
        suiteEnd.globallyExclusive()
        self.nextTests = [suiteEnd]
        self.globalTests = [suiteEnd]
        self.emit('test', suiteEnd)
    }

    self._prepared = true
}

/**
 * Checks whether or not we have an only test of a specified type
 * If the type is Test.TYPE.NORMAL it will check all child suites
 *
 * @param {String} type Type of tests to check only for
 *
 * @returns {boolean} True if we have an only, false if not
 */
Suite.prototype.hasOnly = function (type) {
    var hasOnly = false
        , tests = this.tests[type]

    tests.some(function (test) {
        return hasOnly = test.only()
    })

    if (type === Test.TYPE.NORMAL && !hasOnly) {
        this.suites.some(function (suite) {
            return hasOnly = (suite.only() || suite.hasOnly(type))
        })
    }

    return hasOnly
}

/**
 * Creates a test container for a test
 * Copies beforeEachs and afterEachs in as beforeAlls and afterAlls
 *
 * @param {Test} test The test to build the container around
 *
 * @returns {Suite} The suite that represents the test container
 *
 * @private
 */
Suite.prototype._createTestContainer = function (test) {
    var suite = new Suite(test.title + ' Container')
        , self = this

    function addHooks (type) {
        var adder = (type === Test.TYPE.BEFORE_EACH) ? 'addBeforeAll' : 'addAfterAll'

        self.tests[type].forEach(function (hook) {
            var newHook = hook.clone(suite)

            if (test.skip()) {
                newHook.skip(true)
            }

            suite[adder](newHook)
        })
    }

    addHooks(Test.TYPE.BEFORE_EACH)
    addHooks(Test.TYPE.AFTER_EACH)

    suite.skip(test.skip())
    suite.only(test.only())
    suite.timeout(self.timeout())
    suite.testExclusivity = self.testExclusivity
    suite.exclusivity = suite.testExclusivity

    suite.parent = self
    suite.testContainer = true

    suite.addTest(test)

    return suite
}

/**
 * Copies test properties from the this suite and sets up the graph
 *
 * @param {Test} test The test to prepare
 * @param {Boolean} hasOnly Whether or not the current class of tests have onlys to account for
 *
 * @private
 */
Suite.prototype._setTestProperties = function (test, hasOnly) {
    var self = this

    if (typeof test.exclusivity === 'undefined') {
        test.exclusivity = self.testExclusivity
    }

    if (typeof test.timeout() === 'undefined') {
        test.timeout(self.timeout())
    }

    if (!test.only() && !test.skip()) {
        if (test.type !== Test.TYPE.NORMAL) {
            if (!self.hasOnlyTest) {
                test.skip(self._skip || hasOnly)
            }
        } else {
            test.skip(self._skip || hasOnly)
        }
    }

    if (test.exclusivity === Test.EXCLUSIVITY.NONE) {
        self._nonExclusives.push(test)
        test.addPriorTests(self.nextTests)

    } else {
        //Skip adding dependencies if it is global, PPUnit class handles this for us
        if (test.exclusivity !== Test.EXCLUSIVITY.GLOBAL) {
            if (self._nonExclusives.length) {
                test.addPriorTests(self._nonExclusives)
            } else {
                test.addPriorTests(self.nextTests)
            }
        } else {
            self.globalTests = [test]
        }


        self._nonExclusives = []
        self.nextTests = [test]
    }

    test.addDependencies(self.testDependencies)

    self.emit('test', test)
}

/**
 * Closes out any non exclusive tests that may currently exist
 * May place a test on the graph
 *
 * @private
 */
Suite.prototype._closeNonExclusives = function () {
    if (this._nonExclusives.length) {
        if (this._nonExclusives.length === 1) {
            this.nextTests = this._nonExclusives
            this._nonExclusives = []
            return
        }

        var localEnd = Test.newRoot('Non exclusives end')
        localEnd.parent = this
        localEnd.locallyExclusive()
        localEnd.addPriorTests(this._nonExclusives)

        this._nonExclusives = []
        this.nextTests = [localEnd]
        this.emit('test', localEnd)
    }
}

/**
 * Prepares the suites/test containers to be run
 *
 * @param {Array.<Suite>} suites An array of suites to prepare
 *
 * @private
 */
Suite.prototype._prepareSuites = function (suites) {
    var self = this

    suites.forEach(function (suite) {
        if (!suite.only() && !suite.skip()) {
            suite.skip(self._skip || self.hasOnlyTest)
        }

        if (typeof suite.testExclusivity === 'undefined') {
            suite.testExclusivity = self.testExclusivity
        }

        if (typeof suite.timeout() === 'undefined') {
            suite.timeout(self.timeout())
        }

        if (!suite.testContainer) {
            suite.tests.beforeEach = self.tests.beforeEach.concat(suite.tests.beforeEach)
            suite.tests.afterEach = suite.tests.afterEach.concat(self.tests.afterEach)
        }

        suite.testDependencies = self.testDependencies.slice()

        suite.on('suite', function (suite) {
            self.emit('suite', suite)
        })

        suite.on('test', function (test) {
            if (test.exclusivity === Test.EXCLUSIVITY.GLOBAL) {
                self.globalTests = suite.globalTests.slice()
            }

            self.emit('test', test)
        })

        if (suite.exclusivity !== Suite.EXCLUSIVITY.NONE) {
            self._closeNonExclusives()
        }

        suite.nextTests = self.nextTests.slice()
        suite.prepare()
        self.emit('suite', suite)

        if (suite.exclusivity === Suite.EXCLUSIVITY.NONE) {
            if (suite.globalTests.length) {
                self.nextTests = suite.globalTests.slice()
                self._nonExclusives = []

            } else {
                self._nonExclusives = self._nonExclusives.concat(suite.nextTests.slice())
            }

        } else {
            self.nextTests = suite.nextTests.slice()
        }
    })

    //TODO: May have to add this back in if we see weird connections everywhere
    //self._closeNonExclusives()
}
