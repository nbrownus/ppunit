var BaseReporter = require('./BaseReporter')
  , Test = require('../Test')
  , util = require('util')
  , ms = require('ms')
  , fs = require('fs')
  , path = require('path')

/**
 * Outputs html of the test run timeline
 * Useful for seeing test concurrency
 *
 * @param {PPUnit} ppunit PPUnit instance
 * @param {Object} writer An object that has a write method
 * @param {function} writer.write A method that writes the output
 *
 * @constructor
 */
var Timeline = function (ppunit, writer) {
    Timeline.super_.call(this, ppunit, writer)

    ppunit.on('finish', function () {
        var tests = []

        ppunit.allTests.forEach(function (test) {
            var testClass

            switch (test.result) {
                case Test.RESULT.SUCCESS:
                    testClass = 'success'
                    break

                case Test.RESULT.SKIPPED:
                    testClass = 'skipped'
                    break

                default:
                    testClass = 'failure'
                    break
            }

            tests.push({
                name: test.fullTitle('/')
              , duration: test.duration
              , error: test.error
              , start: test.tickStart || 0
              , end: test.tickEnd
              , class: testClass
            })
        })

        writer.write(fs.readFileSync(path.resolve(__filename, '..', 'templates/timeline.html')).toString())
        writer.write('<script>')
        writer.write('    var tasks = ' + JSON.stringify(tests))
        writer.write('</script>')
    })
}

Timeline.description = 'Outputs the test execution graph in html, useful for debugging concurrency issues'

util.inherits(Timeline, BaseReporter)
module.exports = Timeline
