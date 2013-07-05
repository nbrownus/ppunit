var assert = require('assert')
  , Colors = require('../lib/Colors')

describe('Colors', function () {
    it('Should have colors that do not change', function () {

    })

    it('Should properly wrap a string in colors', function () {
        var str = Colors.wrap(Colors.red, 'Should be wrapped in red')
        assert.equal(str, '$31_start$Should be wrapped in red$color_end$', 'Colorized string mismatch')
    })

    it('Should properly tokenize a wraped color string', function () {
        var str = Colors.tokenize(Colors.wrap(Colors.red, 'Should be wrapped in red'))
        assert.equal(str, '\u001b[' + Colors.red + 'mShould be wrapped in red\u001b[0m', 'Colorized string mismatch')
    })

    it('Should remove color tokens if told to do so', function () {
        var str = Colors.tokenize(Colors.wrap(Colors.red, 'Should be wrapped in red'), true)
        assert.equal(str, 'Should be wrapped in red', 'Colorized string mismatch')
    })
})
