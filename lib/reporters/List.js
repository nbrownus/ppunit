var BaseReporter = require('./BaseReporter')
  , Test = require('../Test')
  , Colors = require('../Colors')
  , util = require('util')

var List = function (ppunit, writer) {
    List.super_.call(this, ppunit, writer)

    var self = this
        , n = 0

    ppunit.on('start', function () {
        writer.write()
    })

    ppunit.on('test start', function (test) {
        test.slowInterval = setInterval(function () {
            if (test.state !== Test.STATE.RUNNING) {
                return clearInterval(test.slowInterval)
            }

            self.writer.write(
                'Running:', test.fullTitle('/'),
                'Timeout:', test.timeout(),
                'Running for:' + (Date.now() - test.startTime)
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
                writer.write(Colors.wrap(Colors.red, '  %d) %s'), ++n, test.fullTitle('/'))
                writer.write(Colors.wrap(Colors.red, '       %s'), test.error)
                break

            case Test.RESULT.SKIPPED:
                if (test.type === Test.TYPE.NORMAL) {
                    format = Colors.wrap(Colors.green, '  -') + Colors.wrap(Colors.cyan, ' %s')
                    writer.write(format, test.fullTitle('/'))
                }
                break

            case Test.RESULT.SUCCESS:
                if (test.type === Test.TYPE.NORMAL) {
                    format = Colors.wrap(Colors.green, '  ' + BaseReporter.SYMBOLS.OK)
                        + Colors.wrap(Colors.intenseBlack, ' %s: ') + '%dms'

                    writer.write(format, test.fullTitle('/'), test.duration)
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
