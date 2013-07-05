var path = require('path')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , util = require('util')
  , Colors = require('../Colors')

/**
 * Handles writing output to a file
 *
 * @param {Object} options An object containing options pertaining to this writer
 * @param {String} options.path An absolute or relative path to write output to
 * @param {String} [options.useColors=false] Whether or not to use colors
 * @param {String} [options.mode=0644] A file mode to create the file with
 *
 * @constructor
 */
var FileWriter = function (options) {
    if (!options.path) {
        throw new Error('A path must be supplied to write to')
    }

    this.path = options.path
    this.useColors = options.useColors || false

    mkdirp.sync(path.dirname(this.path))

    this.fd = fs.openSync(this.path, 'w', options.mode || 0644)
}

module.exports = FileWriter

/**
 * Writes a line to the file
 * Colors are removed from the line
 *
 * @param {...*} varArgs 1 or more arguments, ran through @see util#format then @see Colors#tokenize
 */
FileWriter.prototype.write = function (varArgs) {
    fs.writeSync(this.fd, Colors.tokenize(util.format.apply(util, arguments), !this.useColors) + '\n', null, 'utf8')
}
