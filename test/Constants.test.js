var Constants = require('../lib/Constants')
  , assert = require('assert')

describe('Constants', function () {
    it('Should have constant exclusivities', function () {
        assert.equal(Constants.EXCLUSIVITY.NONE, 0, 'EXCLUSIVITY.NONE constant changed')
        assert.equal(Constants.EXCLUSIVITY.LOCAL, 1, 'EXCLUSIVITY.LOCAL constant changed')
        assert.equal(Constants.EXCLUSIVITY.GLOBAL, 2, 'EXCLUSIVITY.GLOBAL constant changed')
    })

    it('Should have constant results', function () {
        assert.equal(Constants.RESULT.SUCCESS, 1, 'Constants.RESULT.SUCCESS constant changed')
        assert.equal(Constants.RESULT.FAILURE, 2, 'Constants.RESULT.FAILURE constant changed')
        assert.equal(Constants.RESULT.TIMEOUT, 3, 'Constants.RESULT.TIMEOUT constant changed')
        assert.equal(Constants.RESULT.HOOK_FAILURE, 4, 'Constants.RESULT.HOOK_FAILURE constant changed')
        assert.equal(Constants.RESULT.SKIPPED, 5, 'Constants.RESULT.SKIPPED constant changed')
    })

})
