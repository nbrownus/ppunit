var BaseReporter = require('./BaseReporter')
  , Test = require('../Test')
  , util = require('util')
  , Date = global.Date

/**
 * Outputs xunit compatible xml for reporting test stats
 *
 * @extends BaseReporter
 */
var XUnit = function (ppunit, writer) {
    writer.useColors = false

    BaseReporter.call(this, ppunit, writer)

    var self = this

    ppunit.on('finish', function () {
        writer.write(
            self.tag(
                'testsuite'
              , {
                    name: 'PPUnit Tests'
                  , tests: ppunit.stats.tests
                  , failures: ppunit.stats.failures
                  , errors: ppunit.stats.failures
                  , timestamp: (new Date).toUTCString()
                  , time: (ppunit.stats.duration > 0) ? (ppunit.stats.duration / 1000) : 0
                }
              , false
            )
        )

        ppunit.allTests.forEach(function (test) {
            if (test.type === Test.TYPE.ROOT) {
                return
            }

            self.printTest(test)
        })

        writer.write('</testsuite>')
    })
}

XUnit.description = 'Outputs xunit compatible xml for reporting test stats'

util.inherits(XUnit, BaseReporter)
module.exports = XUnit

/**
 * Prints a test in the xunit expected output
 *
 * @param {Test} test Test to print
 */
XUnit.prototype.printTest = function (test) {
    var self = this
      , names = self.getNames(test)
      , attributes = {
            classname: names.class
          , name: names.test
          , time: (test.duration > 0) ? (test.duration / 1000) : 0
        }

    if (test.error) {
        var failure

        //Jenkins can't handle mutliple error elements so pack it all into one
        if (test.error.errors) {
            var body = self.prepareFailureBody(test.error, true)

            test.error.errors.forEach(function (error) {
                body += '\n\n' + self.prepareFailureBody(error, true)
            })

            failure = this.tag(
                'failure'
                , {
                    type: 'Error'
                    , message: 'There were multiple errors, see the stack output'
                }
                , false
                , this.cdata(body)
            )
        } else {
            failure = this.tag(
                'failure'
                , {
                    type: test.error.name || ''
                  , message: test.error.description || test.error.message || test.error.stack.slice(0, test.error.stack.indexOf('\n'))
                }
                , false
                , this.cdata(self.prepareFailureBody(test.error, false))
            )
        }

        self.writer.write(self.tag('testcase', attributes, false, failure))

    } else if (test.skip()) {
        delete attributes.time
        self.writer.write(self.tag('testcase', attributes, false, self.tag('skipped', {}, true)))

    } else {
        self.writer.write(self.tag('testcase', attributes, true))
    }
}

/**
 * Prepares an error body/stack for printing, may contain a nice diff
 *
 * @param {Object} error The error to use in creating the output
 * @param {boolean} includeMessage Whether or not to include the message in the output (or just the stack and diff)
 *
 * @returns {string} The formatted error body
 */
XUnit.prototype.prepareFailureBody = function (error, includeMessage) {
    var stack = error.stack || error
      , body = ''

    //If the error is forcing us to show a diff, prepare it
    if (error.showDiff && typeof error.actual === typeof error.expected) {
        error.actual = JSON.stringify(error.actual)
        error.expected = JSON.stringify(error.expected)
    }

    //Print the diff if we know how
    if (typeof error.actual === 'string'  && typeof error.expected === 'string') {
        if (includeMessage) {
            if (error.description) {
                body = error.description + '\n'

            } else if (error.name === 'AssertionError' && !error.hasOwnProperty('description') && error.message) {
                //Hacky way of telling if assert threw the error and has a message we should
                //display and not containing the expected/actual values
                body = error.message + '\n'

            } else if (error.name) {
                body = error.name + '\n'
            }
        }

        body += this.formatDiff(error, '') + '\n' + stack.slice(stack.indexOf('\n') + 1)
    } else {
        body = error.stack
    }

    return body
}

/**
 * Helper that creates an xml tag
 *
 * @param {String} tagName Name of the tag
 * @param {Object} attributes Object containing attributes for the tag
 * @param {Boolean} close Close style, true = />, false = >
 * @param {String} [content] Content of the tag
 *
 * @returns {string} The built up xml tag
 */
XUnit.prototype.tag = function (tagName, attributes, close, content) {
    var end = close ? '/>' : '>'
      , pairs = []
      , tag

    for (var key in attributes) {
        pairs.push(key + '="' + this.escape(attributes[key]) + '"')
    }

    tag = '<' + tagName + (pairs.length ? ' ' + pairs.join(' ') : '') + end
    if (content) {
        tag += content + '</' + tagName + end
    }

    return tag
}

/**
 * Gets the class and test names for a test
 *
 * @param {Test} test The test to get names for
 *
 * @returns {{class: String, test: String}} An object containing the class and test names
 */
XUnit.prototype.getNames = function (test) {
    var names = []
      , temp = test

    do {
        if (!temp.title || temp.testContainer) {
            continue
        }

        names.unshift(temp.title)
    } while (temp = temp.originalParent || temp.parent)

    return {
        class: names[0]
      , test: names.slice(1).join('/')
    }
}

/**
 * Returns CDATA escaped strings
 *
 * @param {*} string The object to print
 *
 * @returns {string} Escaped CDATA string
 */
XUnit.prototype.cdata = function (string) {
    return '<![CDATA[' + string + ']]>'
}

/**
 * Escape special characters in the given string of xml
 *
 * @param  {*} xml Object to escape
 *
 * @return {String} The escaped string
 */
XUnit.prototype.escape = function (xml) {
    return String(xml)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}
