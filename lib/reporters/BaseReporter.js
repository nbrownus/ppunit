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
        if (i > 0) {
            self.writer.write()
        }

        self.writer.write(
            Colors.wrap(Colors.default, '  %s) %s:')
          , test.failureNumber
          , test.fullTitle('/')
        )

        self.printError(test.error)

        if (test.error.errors) {
            test.error.errors.forEach(function (subError) {
                self.writer.write()
                self.printError(subError)
            })
        }
    })
}

/**
 * Prints an error, possibly with a pretty printed diff
 *
 * @param {Object} error The error object to print
 */
BaseReporter.prototype.printError = function (error) {
    var message = error.message || ''
      , stack = error.stack || message
      , index = stack.indexOf(message) + message.length

    //If the error is forcing us to show a diff, prepare it
    if (error.showDiff && typeof error.actual === typeof error.expected) {
        error.actual = JSON.stringify(error.actual)
        error.expected = JSON.stringify(error.expected)
    }

    //See if the writer can print the diff and we know how
    if (typeof error.actual === 'string'  && typeof error.expected === 'string') {
        var indent = '     '

        function colorLines(color, str) {
            return str.split('\n').map(function (str) {
                return Colors.wrap(color, str)
            }).join('\n')
        }

        function cleanUp(line) {
            if (line[0] === '+') {
                return indent + colorLines(Colors.bgGreen, line)
            }

            if (line[0] === '-') {
                return indent + colorLines(Colors.bgRed, line)
            }

            if (line.match(/\@\@/)) {
                return null
            }

            if (line.match(/\\ No newline/)) {
                return null
            }

            return indent + line
        }

        function notBlank(line) {
            return line != null
        }

        if (error.description) {
            this.writer.write('     ' + Colors.wrap(Colors.red, error.description))

        } else if (error.name === 'AssertionError' && !error.hasOwnProperty('description') && error.message) {
            //Hacky way of telling if assert threw the error and has a message we should
            //display and not containing the expected/actual values
            this.writer.write('     ' + Colors.wrap(Colors.red, error.message))

        } else if (error.name) {
            //Print the error type if nothing else
            this.writer.write('     ' + Colors.wrap(Colors.red, error.name))
        }

        //If the error didn't have a message then strip the first line of the stack off
        if (!message) {
            index = stack.indexOf('\n')
        }

        this.writer.write()
        this.writer.write(indent + Colors.wrap(Colors.bgGreen, '+ expected') + ' ' +  Colors.wrap(Colors.bgRed,   '- actual'))
        this.writer.write()

        //Get the diff and trim off the header
        var lines = diff.createPatch('string', error.actual, error.expected).split('\n').splice(4)
        this.writer.write(lines.map(cleanUp).filter(notBlank).join('\n'))

    } else {
        this.writer.write(Colors.wrap(Colors.red, '     ' + stack.slice(0, index)))
    }

    //Indent and print the stack trace
    this.writer.write(Colors.wrap(
        Colors.intenseBlack
      , stack.slice(index ? index + 1 : index).replace(/^/gm, '   ')
    ))
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

    format = Colors.wrap(Colors.green, '    %d of %d %s succeeded') + Colors.wrap(Colors.intenseBlack, ' (%s)')
    this.writer.write(format, stats.passes, stats.tests, pluralize(stats.passes), ms(stats.duration))

    if (stats.skipped) {
        this.writer.write(Colors.wrap(Colors.cyan, '    %d %s skipped'), stats.skipped, pluralize(stats.skipped))
    }

    this.writer.write(Colors.wrap(Colors.magenta, '    %d max concurrent %s'), stats.maxConcurrency, pluralize(stats.maxConcurrency))

    if (stats.failures) {
        format = Colors.wrap(Colors.intenseRed, '\n  ' + BaseReporter.SYMBOLS.ERROR)
            + Colors.wrap(Colors.red, ' %d %s failed')

        this.writer.write(format, stats.failures, pluralize(stats.tests))

        this.listFailures()
    }
}
