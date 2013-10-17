var BaseReporter = require('./BaseReporter')
  , Test = require('../Test')
  , util = require('util')

/**
 * Outputs graphviz dot notation of the test dependency graph
 *
 * @param {PPUnit} ppunit PPUnit instance
 * @param {Object} writer An object that has a write method
 * @param {function} writer.write A method that writes the output
 *
 * @constructor
 */
var Dependencies = function (ppunit, writer) {
    Dependencies.super_.call(this, ppunit, writer)
    var self = this

    self.subGraphs = []

    ppunit.on('start', function () {
        writer.write('digraph PPUnit {')
        self.printNodes()
        self.printSubGraphs()
        self.printDependencies()
        writer.write('}')
    })
}

Dependencies.description = 'Outputs the test dependency graph in graphviz dot notation'

util.inherits(Dependencies, BaseReporter)
module.exports = Dependencies

/**
 * Outputs all tests as nodes and builds up the subgraphs for later
 */
Dependencies.prototype.printNodes = function () {
    var self = this
      , color = ''
      , line = ''

    self.ppunit.allTests.forEach(function (test) {
        if (test.skip()) {
            color = 'azure4'

        } else if (test.exclusivity == Test.EXCLUSIVITY.GLOBAL) {
            if (test.type === Test.TYPE.ROOT) {
                color = 'blue'
            } else {
                color = 'red'
            }
        } else {
            color = 'white'
        }

        var allRows = []
        if (test.type === Test.TYPE.NORMAL || test.parent.testContainer) {
            allRows.push(test.title)
        } else {
            allRows.push(test.fullTitle('/'))
        }

        line = '    node' + test.id + ' [shape=record' +
            ', label="{' + allRows.join('|').replace(/(>|<|")/g, '\\$1') + '}"' +
            ', style=filled, fillcolor=' + color + '];'

        self.writer.write(line)

        if (test.parent.testContainer || (test.type === Test.TYPE.NORMAL && test.parent)) {
            var parent = (test.parent.testContainer) ? test.parent.parent : test.parent

            if (!parent.subGraphed) {
                parent.subGraphed = true
                self.subGraphs[parent.id] = {
                    id: parent.id
                  , label: parent.fullTitle('/')
                  , tests: []
                  , node: parent
                }
            }

            self.subGraphs[parent.id].tests.push(test)
        }
    })

    self.writer.write()
}

/**
 * Outputs all subgraphs and the nodes that belong in them
 */
Dependencies.prototype.printSubGraphs = function () {
    var self = this
        , line = ''

    self.subGraphs.forEach(function (subgraph) {
        //TODO: this sucks
        var style = (subgraph.node.exclusivity === 1) ? 'solid' : 'dotted'

        line = '    subgraph cluster_' + subgraph.id + ' {\n'
        line += '        label="' + subgraph.label + '";\n'
        line += '        graph[style=' + style + '];'

        self.writer.write(line + '\n')

        subgraph.tests.forEach(function (test) {
            self.writer.write('        node' + test.id + ';')
        })

        self.writer.write('    }')
    })

    self.writer.write()
}

/**
 * Outputs all node dependencies which draws the lines that link nodes together
 */
Dependencies.prototype.printDependencies = function () {
    var self = this

    self.ppunit.allTests.forEach(function (test) {
        test.nextTests.forEach(function (nextTest) {
            self.writer.write('    node' + test.id + ' -> node' + nextTest.id + ';')
        })
    })
}
