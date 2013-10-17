var BaseReporter = require('./BaseReporter')
  , Test = require('../Test')
  , util = require('util')
  , ms = require('ms')

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
    var self = this

    self.subGraphs = []

    ppunit.on('finish', function () {
        writer.write('<html><body><table style="background-color: #EEEEEE">')
        writer.write('<style>tr td { border-bottom: thin solid #fddfab; background-color: white }</style>')
        var i
        var rows = [[{ title: ''}]]

        for (i = 1; i <= ppunit.stats.maxConcurrency; i++) {
            rows[0].push({ title: 'Slot ' + i, rowspan: '0', style: '' })
        }

        for (i = 1; i <= ppunit.tickId; i++) {
            rows.push([])
            rows[i].push({
                title: 'T' + i
              , rowspan: '1'
              , style: ''
            })
        }

        ppunit.allTests.forEach(function (test) {
            var style = 'border:1px solid;'

            if (test.result === Test.RESULT.SKIPPED) {
                style += 'background-color: #E0EBFF;'
            } else if (test.result !== Test.RESULT.SUCCESS) {
                style += 'background-color: #FFE6E6;'
            }

            rows[(test.tickStart + 1)].push({
                title: test.fullTitle('/') + ' (' + ms(test.duration) + ')'
              , rowspan: (test.tickEnd - test.tickStart)
              , style: style
            })
        })

        rows.forEach(function (row) {
            writer.write('    <tr>')

            var max = 0
            row.forEach(function (cell) {
                max++
                writer.write('        <td rowspan="' + cell.rowspan + '" style="' + cell.style + '" valign="top">' + cell.title + '</td>')
            })

            writer.write('    </tr>')
        })

        writer.write('</html></body></table>')
    })
}

Timeline.description = 'Outputs the test execution graph in graphviz dot notation'

util.inherits(Timeline, BaseReporter)
module.exports = Timeline
