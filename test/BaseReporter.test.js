var BaseReporter = require('../lib/reporters/BaseReporter')
  , assert = require('assert')

describe('BaseReporter', function () {
    it('Should have constant symbols', function () {
        assert.equal(BaseReporter.SYMBOLS.OK, '✓', 'SYMBOLS.OK constant changed')
        assert.equal(BaseReporter.SYMBOLS.ERROR, '✖', 'SYMBOLS.ERROR constant changed')
        assert.equal(BaseReporter.SYMBOLS.DOT, '·', 'SYMBOLS.DOT constant changed')
    })
})
