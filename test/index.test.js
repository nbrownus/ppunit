var PPUnit = require('../')
  , assert = require('assert')

describe('index.js', function () {
    it('Should export all interesting things', function () {
        assert(typeof PPUnit === 'function', 'PPUnit is not exported correctly')
        assert(typeof PPUnit.interfaces === 'object', 'PPUnit.interfaces is not exported correctly')
        assert(typeof PPUnit.reporters === 'object', 'PPUnit.reporters is not exported correctly')
        assert(typeof PPUnit.writers === 'object', 'PPUnit.writers is not exported correctly')
        assert(typeof PPUnit.Test === 'function', 'PPUnit.Test is not exported correctly')
        assert(typeof PPUnit.Suite === 'function', 'PPUnit.Suite is not exported correctly')
        assert(typeof PPUnit.Colors === 'object', 'PPUnit.Colors is not exported correctly')
    })
})
