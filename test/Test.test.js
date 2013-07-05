var Test = require('../lib/Test')
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
    })

})
