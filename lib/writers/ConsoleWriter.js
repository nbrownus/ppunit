var util = require('util')
  , Colors = require('../Colors')

/**
 * Handles writing output to stdout
 *
 * @param {Object} options An object containing options pertaining to this writer
 * @param {Boolean} [options.useColors] Whether or not to use colors
 *      default attempts to figure out if the tty supports colors
 *
 * @constructor
 */
var ConsoleWriter = function (options) {
    options = options || {}
    this.isTTY = process.stdout.isTTY
    this.useColors = options.useColors || this.isTTY
}

module.exports = ConsoleWriter

/**
 * Writes a line to stdout
 *
 * @param {...*} varArgs 1 or more arguments, ran through @see util#format then @see Colors#tokenize
 */
ConsoleWriter.prototype.write = function (varArgs) {
    process.stdout.write(Colors.tokenize(util.format.apply(util, arguments), !this.useColors) + '\n')
}
