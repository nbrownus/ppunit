var BaseReporter = require('./BaseReporter')
  , Test = require('../Test')
  , util = require('util')
  , Date = global.Date

/**
 * Outputs xunit compatible xml for reporting test stats
 */
var XUnit = function (ppunit, writer) {
    BaseReporter.call(this, ppunit, writer)

    var self = this

    ppunit.on('finish', function () {
        writer.write(
            self.tag(
                'testsuite'
              , {
                    name: 'Mocha Tests'
                  , tests: ppunit.stats.tests
                  , failures: ppunit.stats.failures
                  , errors: ppunit.stats.failures
                  , skip: (ppunit.stats.tests - ppunit.stats.failures - ppunit.stats.passes)
                  , timestamp: (new Date).toUTCString()
                  , time: (ppunit.stats.duration > 0) ? (ppunit.stats.duration / 1000) : 0
                }
              , false
            )
        )

        ppunit.allTests.forEach(function (test) {
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
    var names = this.getNames(test)
      , attributes = {
            classname: names.class
          , name: names.test
          , time: (test.duration > 0) ? (test.duration / 1000) : 0
        }

    if (test.error) {
        attributes.message = this.escape(test.error.message)
        this.writer.write(
            this.tag(
                'testcase'
              , attributes
              , false
              , this.tag('failure', attributes, false, this.cdata(test.error.stack))
            )
        )

    } else if (test.skip) {
        delete attributes.time
        this.writer.write(this.tag('testcase', attributes, false, this.tag('skipped', {}, true)))

    } else {
        this.writer.write(this.tag('testcase', attributes, true))
    }
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
        if (!temp.title) {
            continue
        }

        names.unshift(temp.title)
    } while (temp = temp.parent)

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
    return '<![CDATA[' + this.escape(string) + ']]>'
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
