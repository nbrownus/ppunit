var BaseReporter = require('./BaseReporter')
  , Test = require('../Test')
  , TestError = require('../TestError')
  , Colors = require('../Colors')
  , util = require('util')
  , Date = global.Date
  , ms = require('ms')
  , setInterval = global.setInterval
  , clearInterval = global.clearInterval

var List = function (ppunit, writer) {
    List.super_.call(this, ppunit, writer)

    var self = this

    self.tests = 0

    ppunit.on('start', function () {
        writer.write()
    })

    ppunit.on('test start', function (test) {
        test.slowInterval = setInterval(function () {
            if (test.state !== Test.STATE.RUNNING) {
                return clearInterval(test.slowInterval)
            }

            self.writer.write(
                Colors.wrap(Colors.yellow, '  * ')
                    + Colors.wrap(Colors.intenseBlack, '%s; Timeout: %s, Taken: %s')
              , test.fullTitle('/')
              , ms(test.timeout())
              , ms((Date.now() - test.startTime))
            )

        }, 10000)
    })

    ppunit.on('test finish', function (test) {
        var format
        clearInterval(test.slowInterval)

        switch (test.result) {
            case Test.RESULT.HOOK_FAILURE:
                if (test.type !== Test.TYPE.NORMAL) {
                    break
                }

            case Test.RESULT.FAILURE:
            case Test.RESULT.TIMEOUT:
                writer.write(
                    Colors.wrap(Colors.red, '  %d) %s') + Colors.wrap(Colors.intenseBlack, ' (%s of %s)')
                  , test.failureNumber
                  , test.fullTitle('/')
                  , test.completedNumber
                  , ppunit.stats.tests
                )

                writer.write(Colors.wrap(Colors.red, '       %s'), test.error)

                if (test.error instanceof TestError) {
                    test.error.errors.forEach(function (sub_error) {
                        writer.write(Colors.wrap(Colors.red, '       %s'), sub_error)
                    })
                }

                break

            case Test.RESULT.SKIPPED:
                format = Colors.wrap(Colors.green, '  -') + Colors.wrap(Colors.cyan, ' %s')
                    + Colors.wrap(Colors.intenseBlack, ' (%s of %s)')
                writer.write(format, test.fullTitle('/'), test.completedNumber, ppunit.stats.tests)
                break

            case Test.RESULT.SUCCESS:
                if (test.type === Test.TYPE.NORMAL) {
                    format = Colors.wrap(Colors.green, '  ' + BaseReporter.SYMBOLS.OK)
                        + Colors.wrap(Colors.white, ' %s: ') + '%s' + Colors.wrap(Colors.intenseBlack, ' (%s of %s)')

                    writer.write(format, test.fullTitle('/'), ms(test.duration), test.completedNumber, ppunit.stats.tests)

                } else if (test.type !== Test.TYPE.ROOT) {
                    format = Colors.wrap(Colors.intenseBlack, '  ' + BaseReporter.SYMBOLS.OK + ' %s: %s (%s of %s)')
                    writer.write(format, test.fullTitle('/'), ms(test.duration), test.completedNumber, ppunit.stats.tests)
                }
        }
    })

    ppunit.on('finish', function () {
        self.epilogue()
    })
}

List.description = 'Outputs a minimalistic list view of test results with an epilogue'

util.inherits(List, BaseReporter)
module.exports = List
