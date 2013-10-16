var Test = require('../lib/Test')
  , TestError = require('../lib/TestError')
  , Suite = require('../lib/Suite')
  , ms = require('ms')
  , assert = require('assert')

describe('Test', function () {

    describe('Constants', function () {
        it('Should have constant test types', function () {
            assert.equal(Test.TYPE.NORMAL, 'normal', 'Test.TYPE.NORMAL constant changed')
            assert.equal(Test.TYPE.BEFORE_EACH, 'beforeEach', 'Test.TYPE.BEFORE_EACH constant changed')
            assert.equal(Test.TYPE.AFTER_EACH, 'afterEach', 'Test.TYPE.AFTER_EACH constant changed')
            assert.equal(Test.TYPE.BEFORE_ALL, 'beforeAll', 'Test.TYPE.BEFORE_ALL constant changed')
            assert.equal(Test.TYPE.AFTER_ALL, 'afterAll', 'Test.TYPE.AFTER_ALL constant changed')
            assert.equal(Test.TYPE.ROOT, 'root', 'Test.TYPE.ROOT constant changed')
        })

        it('Should have constant run states', function () {
            assert.equal(Test.STATE.WAITING, 0, 'Test.STATE.WAITING constant changed')
            assert.equal(Test.STATE.RUNNING, 1, 'Test.STATE.RUNNING constant changed')
            assert.equal(Test.STATE.COMPLETED, 2, 'Test.STATE.COMPLETED constant changed')
        })

        it('Should have constant results', function () {
            assert.equal(Test.RESULT.SUCCESS, 1, 'Test.RESULT.SUCCESS constant changed')
            assert.equal(Test.RESULT.FAILURE, 2, 'Test.RESULT.FAILURE constant changed')
            assert.equal(Test.RESULT.TIMEOUT, 3, 'Test.RESULT.TIMEOUT constant changed')
            assert.equal(Test.RESULT.HOOK_FAILURE, 4, 'Test.RESULT.HOOK_FAILURE constant changed')
            assert.equal(Test.RESULT.SKIPPED, 5, 'Test.RESULT.SKIPPED constant changed')
        })

        it('Should have constant exclusivities', function () {
            assert.equal(Test.EXCLUSIVITY.NONE, 0, 'Test.EXCLUSIVITY.NONE constant changed')
            assert.equal(Test.EXCLUSIVITY.LOCAL, 1, 'Test.EXCLUSIVITY.LOCAL constant changed')
            assert.equal(Test.EXCLUSIVITY.GLOBAL, 2, 'Test.EXCLUSIVITY.GLOBAL constant changed')
        })
    })

    describe('Completing tests', function () {
        it('Should note how long a test took if it eventually succeeds after a timeout', function (done) {
            var test = new Test('testing', function (inner_done) {
                setTimeout(inner_done, 3)
            })

            test.timeout(1)
            test.parent = new Suite()
            test.on('finish', function (previous) {
                if (previous) {
                    try {
                        assert.equal(
                            test.error.message
                            , 'Timeout of 1ms exceeded, eventually succeeded after ' + ms(test.duration)
                            , 'Test error was incorrect'
                        )

                        assert(test.error instanceof TestError, 'Error was not a TestError')
                        assert.equal(previous.result, Test.RESULT.TIMEOUT, 'Previous test result was wrong')
                        assert.equal(test.result, Test.RESULT.TIMEOUT, 'Current test result was wrong')
                    } catch (error) {
                        return done(error)
                    }

                    done()
                }
            })

            test.run()
        })

        it('Should note how long a test took if it eventually fails after a timeout', function (done) {
            var test = new Test('testing', function (inner_done) {
                setTimeout(function () {
                    inner_done(new Error('failed'))
                }, 3)
            })

            test.timeout(1)
            test.parent = new Suite()
            test.on('finish', function (previous) {
                if (previous) {
                    try {
                        assert.equal(
                            test.error.message
                            , 'Timeout of 1ms exceeded, eventually failed after ' + ms(test.duration)
                            , 'Test error was incorrect'
                        )

                        assert(test.error instanceof TestError, 'Error was not a TestError')
                        assert.equal(test.error.errors[0].message, 'failed', 'TestError did not have the actual error message')
                        assert.equal(previous.result, Test.RESULT.TIMEOUT, 'Previous test result was wrong')
                        assert.equal(test.result, Test.RESULT.TIMEOUT, 'Current test result was wrong')
                    } catch (error) {
                        return done(error)
                    }

                    done()
                }
            })

            test.run()
        })

        it('Should fail a successful test if done was called more than once', function (done) {
            var test = new Test('testing', function (inner_done) {
                inner_done()
                inner_done()
            })

            test.parent = new Suite()
            test.on('finish', function (previous) {
                if (previous) {
                    try {
                        assert.equal(
                            test.error.message
                          , 'done() called multiple times'
                          , 'Test error was incorrect'
                        )

                        assert(test.error instanceof TestError, 'Error was not a TestError')
                        assert.equal(previous.result, Test.RESULT.SUCCESS, 'Previous test result was wrong')
                        assert.equal(test.result, Test.RESULT.FAILURE, 'Current test result was wrong')
                    } catch (error) {
                        return done(error)
                    }

                    done()
                }
            })

            test.run()
        })

        it('Should ignore mutliple calls to done if the first was a failure', function (done) {
            var test = new Test('testing', function (inner_done) {
                inner_done(new Error('failed'))
                inner_done()
                setTimeout(function () {
                    done()
                }, 10)
            })

            test.parent = new Suite()
            test.on('finish', function (previous) {
                if (previous) {
                    done(new Error('Should not be here'))
                }
            })

            test.run()
        })

        it('Should fail a successful test if done was called multiple times', function (done) {
            var test = new Test('testing', function (inner_done) {
                inner_done()
                inner_done()
            })

            test.parent = new Suite()
            test.on('finish', function (previous) {
                if (previous) {
                    try {
                        assert.equal(
                            test.error.message
                          , 'done() called multiple times'
                          , 'Test error was incorrect'
                        )

                        assert(test.error instanceof TestError, 'Error was not a TestError')
                        assert.equal(previous.result, Test.RESULT.SUCCESS, 'Previous test result was wrong')
                        assert.equal(test.result, Test.RESULT.FAILURE, 'Current test result was wrong')
                    } catch (error) {
                        return done(error)
                    }

                    done()
                }
            })

            test.run()
        })
    })
})
