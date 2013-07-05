var Constants = require('../lib/Constants')
  , assert = require('assert')

describe('Constants', function () {
    it('Should have constant exclusivities', function () {
        assert.equal(Constants.EXCLUSIVITY.NONE, 0, 'EXCLUSIVITY.NONE constant changed')
        assert.equal(Constants.EXCLUSIVITY.LOCAL, 1, 'EXCLUSIVITY.LOCAL constant changed')
        assert.equal(Constants.EXCLUSIVITY.GLOBAL, 2, 'EXCLUSIVITY.GLOBAL constant changed')
    })


})
