var Colors = require('../Colors')
  , diff = require('diff')
  , ms = require('ms')

/**
 * Base functionality for reporters
 *
 * @param {PPUnit} ppunit PPUnit instance
 * @param {Object} writer An object that has a write method
 * @param {function} writer.write A method that writes the output
 *
 * @constructor
 */
var BaseReporter = function (ppunit, writer) {
    this.ppunit = ppunit
    this.writer = writer
}

module.exports = BaseReporter

module.exports.SYMBOLS = {
    OK: '✓'
  , ERROR: '✖'
  , DOT: '·'
}

/**
 * Lists out all errored tests with the test title, error message, stack trace, and possibly diff
 */
BaseReporter.prototype.listFailures = function () {
    var self = this
    self.writer.write()

    self.ppunit.failures.forEach(function (test, i) {
        var format = Colors.wrap(Colors.default, '  %s) %s:\n')
            + Colors.wrap(Colors.red, '     %s')
            + Colors.wrap(Colors.intenseBlack, '\n%s\n')

        var error = test.error
          , message = error.message || ''
          , stack = error.stack || message
          , index = stack.indexOf(message) + message.length
          , actual = error.actual
          , expected = error.expected

        message = stack.slice(0, index)

        if (error.showDiff) {
            error.actual = actual = JSON.stringify(actual, null, 2)
            error.expected = expected = JSON.stringify(expected, null, 2)
        }

        //Show the diff if we can
        if (self.writer.useColors && typeof actual === 'string' && typeof expected === 'string') {
            var len = Math.max(actual.length, expected.length)

            if (len < 20) {
                message = self.errorDiff(error.actual, error.expected, 'Chars')
            } else {
                message = self.errorDiff(error.actual, error.expected, 'Words')
            }

            var lines = message.split('\n')
            if (lines.length > 4) {
                var width = String(lines.length).length
                message = lines.map(function (str, i) {
                    return self.pad(++i, width) + ' |' + ' ' + str
                }).join('\n')
            }

            message = '\n'
                + Colors.wrap(Colors.bgRed, 'actual')
                + ' '
                + Colors.wrap(Colors.bgGreen, 'expected')
                + '\n\n'
                + message
                + '\n'

            message = message.replace(/^/gm, '      ')

            format = Colors.wrap(Colors.default, '  %s) %s:\n%s')
                + Colors.wrap(Colors.intenseBlack, '\n%s\n')
        }

        stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ')
        self.writer.write(format, (i + 1), test.fullTitle('/'), message, stack)
    })
}

/**
 * Prints stats about the run and lists all failures
 */
BaseReporter.prototype.epilogue = function () {
    var stats = this.ppunit.stats
      , format

    this.writer.write()

    function pluralize (n) {
        return 1 == n ? 'test' : 'tests'
    }

    if (stats.failures) {
        format = Colors.wrap(Colors.intenseRed, '  ' + BaseReporter.SYMBOLS.ERROR)
            + Colors.wrap(Colors.red, ' %d of %d %s failed')
            + Colors.wrap(Colors.intenseBlack, ' (%s)')

        this.writer.write(format, stats.failures, stats.tests, pluralize(stats.tests), ms(stats.duration))

        if (stats.skipped) {
            this.writer.write(
                Colors.wrap(Colors.cyan, '    %d %s skipped')
                , stats.skipped
                , pluralize(stats.skipped)
            )
        }

        this.listFailures()
        this.writer.write()
        return
    }

    format = Colors.wrap(Colors.intenseGreen, ' ')
        + Colors.wrap(Colors.green, ' %d %s complete')
        + Colors.wrap(Colors.intenseBlack, ' (%s)')

    //TODO: Duration needs to be stringified
    this.writer.write(format, stats.tests, pluralize(stats.tests), ms(stats.duration))

    if (stats.skipped) {
        this.writer.write(
            Colors.wrap(Colors.cyan, ' ') + Colors.wrap(Colors.cyan, ' %d %s skipped')
          , stats.skipped
          , pluralize(stats.skipped)
        )
    }

    this.writer.write()
}

/**
 * Generates a colorized diff string
 *
 * @param {String} actual String that was provided
 * @param {String} expected String that was expected
 * @param {String} type Type of diff to create @see diff, Chars, Words, Lines, or Css
 *
 * @returns {String} The colorized string showing the diff of actual and expected
 */
BaseReporter.prototype.errorDiff = function (actual, expected, type) {
    return diff['diff' + type](actual, expected).map(function (string) {
        if (string.added) {
            return Colors.wrap(Colors.bgGreen, string.value)
        }

        if (string.removed) {
            return Colors.wrap(Colors.bgRed, string.value)
        }

        return string.value
    }).join('')
}

/**
 * Pads the string with length number of spaces
 *
 * @param {*} str The string to pad
 * @param {Number} length The number of spaces to add
 *
 * @returns {string} The padded string
 */
BaseReporter.prototype.pad = function (str, length) {
    var arr = new Array(length - String(str).length + 1)
    return arr.join(' ') + str
}
