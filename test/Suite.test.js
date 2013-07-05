var Suite = require('../lib/Suite')
  , assert = require('assert')

describe('Suite', function () {

    describe('Constants', function () {
        it('Should have constant exclusivities', function () {
            assert.equal(Suite.EXCLUSIVITY.NONE, 0, 'Suite.EXCLUSIVITY.NONE constant changed')
            assert.equal(Suite.EXCLUSIVITY.LOCAL, 1, 'Suite.EXCLUSIVITY.LOCAL constant changed')
            assert.equal(Suite.EXCLUSIVITY.GLOBAL, 2, 'Suite.EXCLUSIVITY.GLOBAL constant changed')
        })
    })

})
