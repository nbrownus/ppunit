
var PPUnit = require('../')
  , assert = require('assert')
  , ppunit = new PPUnit()
  , ran = {
        pass: false
      , 'pass async': false
      , fail: false
      , 'fail async': false
    }

ppunit.rootSuite.addTest(new PPUnit.Test('pass', function () {
    ran['pass'] = true
}))

ppunit.rootSuite.addTest(new PPUnit.Test('pass async', function (done) {
    ran['pass async'] = true
    setTimeout(function () {
        done()
    }, 10)
}))

ppunit.rootSuite.addTest(new PPUnit.Test('fail', function () {
    ran['fail'] = true
    throw new Error('Should fail')
}))

ppunit.rootSuite.addTest(new PPUnit.Test('fail async', function (done) {
    ran['fail async'] = true
    setTimeout(function () {
        done(new Error('Should fail'))
    }, 10)
}))

ppunit.run(function () {
    Object.keys(ran).forEach(function (test) {
        assert(ran[test], 'Basic test functionality does not exist!')
    })

    assert(ppunit.failures.length === 2, 'Basic test functionality does not exist!')
    assert(ppunit.stats.tests === 4, 'Basic test functionality does not exist!')
})
