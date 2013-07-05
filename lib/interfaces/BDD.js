var Suite = require('../Suite')
  , Test = require('../Test')

/**
 * BDD style interface
 *
 * @param {Suite} rootSuite The root suite
 * @param {Object} context Context to install methods on to provide the interface
 *
 * @constructor
 */
var BDD = function (rootSuite, context) {
    this.suites = [rootSuite]
    this.context = context

    this._setupContext()
}

module.exports = BDD

/**
 * Adds a child suite under the current suite
 * If no function is provided the suite will be skipped
 *
 * @param {String} title Title of the suite, used in reporting
 * @param {function} func Function that builds the tests within the suite
 *
 * @returns {Suite} Suite that was created
 */
BDD.prototype.describe = function (title, func) {
    var suite = new Suite(title)
    this.suites[0].addSuite(suite)
    this.suites.unshift(suite)

    if (typeof func === 'function') {
        func.call(suite)
    } else {
        suite.skip(true)
    }

    this.suites.shift()
    return suite
}

/**
 * Adds a child suite under the current suite and sets it to be skipped
 * If any tests are described in the suite they will be skipped as well
 *
 * @param {String} title Title of the suite, used in reporting
 * @param {function} func Function that builds the tests within the suite
 *
 * @returns {Suite} Suite that was created
 */
BDD.prototype.describe.skip = function (title, func) {
    var suite = this.describe(title, func)
    suite.skip(true)
    return suite
}

BDD.prototype.describe.only = function (title, func) {
    var suite = this.describe(title, func)
    suite.only(true)
    return suite
}

BDD.prototype.it = function (title, func) {
    var suite = this.suites[0]
      , test = new Test(title, func)

    suite.addTest(test)
    return test
}

BDD.prototype.it.skip = function (title, func) {
    var test = this.it(title, func)
    test.skip(true)
    return test
}

BDD.prototype.it.only = function (title, func) {
    var test = this.it(title, func)
    test.only(true)
    return test
}

BDD.prototype.before = function (title, func) {
    if (arguments.length === 1) {
        func = title
        title = 'Before all hook ' + (this.suites[0].tests.beforeAll.length + 1)
    }

    var suite = this.suites[0]
      , hook = Test.newBeforeAll(title, func)

    suite.addBeforeAll(hook)
    return hook
}

BDD.prototype.before.only = function (title, func) {
    var hook = this.before.apply(this, arguments)
    hook.only(true)
    return hook
}

BDD.prototype.before.skip = function (title, func) {
    var hook = this.before.apply(this, arguments)
    hook.skip(true)
    return hook
}

BDD.prototype.after = function (title, func) {
    if (arguments.length === 1) {
        func = title
        title = 'After all hook ' + (this.suites[0].tests.afterAll.length + 1)
    }

    var suite = this.suites[0]
      , hook = new Test.newAfterAll(title, func)

    suite.addAfterAll(hook)
    return hook
}

BDD.prototype.after.only = function (title, func) {
    var hook = this.after.apply(this, arguments)
    hook.only(true)
    return hook
}

BDD.prototype.after.skip  = function (title, func) {
    var hook = this.after.apply(this, arguments)
    hook.skip(true)
    return hook
}

BDD.prototype.beforeEach = function (title, func) {
    if (arguments.length === 1) {
        func = title
        title = 'Before each hook ' + (this.suites[0].tests.beforeEach.length + 1)
    }

    var suite = this.suites[0]
      , hook = Test.newBeforeEach(title, func)

    suite.addBeforeEach(hook)
    return hook
}

BDD.prototype.beforeEach.only = function (title, func) {
    var hook = this.beforeEach.apply(this, arguments)
    hook.only(true)
    return hook
}

BDD.prototype.beforeEach.skip = function (title, func) {
    var hook = this.beforeEach.apply(this, arguments)
    hook.skip(true)
    return hook
}

BDD.prototype.afterEach = function (title, func) {
    if (arguments.length === 1) {
        func = title
        title = 'After each hook ' + (this.suites[0].tests.afterEach.length + 1)
    }

    var suite = this.suites[0]
      , hook = Test.newAfterEach(title, func)

    suite.addAfterEach(hook)
    return hook
}

BDD.prototype.afterEach.only = function (title, func) {
    var hook = this.afterEach.apply(this, arguments)
    hook.only(true)
    return hook
}

BDD.prototype.afterEach.skip = function (title, func) {
    var hook = this.afterEach.apply(this, arguments)
    hook.skip(true)
    return hook
}

/**
 * Puts the methods that provide this interface on the context given to us
 *
 * @private
 */
BDD.prototype._setupContext = function () {
    var self = this

    self.context.describe = function () { return self.describe.apply(self, arguments) }
    self.context.describe.skip = function () { return self.describe.skip.apply(self, arguments) }
    self.context.describe.only = function () { return self.describe.only.apply(self, arguments) }

    self.context.it = function () { return self.it.apply(self, arguments) }
    self.context.it.skip = function () { return self.it.skip.apply(self, arguments) }
    self.context.it.only = function () { return self.it.only.apply(self, arguments) }

    self.context.before = function () { return self.before.apply(self, arguments) }
    self.context.before.only = function () { return self.before.only.apply(self, arguments) }
    self.context.before.skip = function () { return self.before.skip.apply(self, arguments) }

    self.context.after = function () { return self.after.apply(self, arguments) }
    self.context.after.only = function () { return self.after.only.apply(self, arguments) }
    self.context.after.skip = function () { return self.after.skip.apply(self, arguments) }

    self.context.beforeEach = function () { return self.beforeEach.apply(self, arguments) }
    self.context.beforeEach.only = function () { return self.beforeEach.only.apply(self, arguments) }
    self.context.beforeEach.skip = function () { return self.beforeEach.skip.apply(self, arguments) }

    self.context.afterEach = function () { return self.afterEach.apply(self, arguments) }
    self.context.afterEach.only = function () { return self.afterEach.only.apply(self, arguments) }
    self.context.afterEach.skip = function () { return self.afterEach.skip.apply(self, arguments) }
}
