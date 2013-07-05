/**
 * Provides console color support
 */

/**
 * Valid colors
 */
module.exports = {
    default: '0'
    //Normal colors
  , black: '30'
  , red: '31'
  , green: '32'
  , yellow: '33'
  , blue: '34'
  , magenta: '35'
  , cyan: '36'
  , white: '37'
    //Intense colors
  , intenseBlack: '90'
  , intenseRed: '91'
  , intenseGreen: '92'
  , intenseYellow: '93'
  , intenseBlue: '94'
  , intenseMagenta: '95'
  , intenseCyan: '96'
  , intenseWhite: '97'
    //Background colors
  , bgBlack: '40'
  , bgRed: '41'
  , bgGreen: '42'
  , bgYellow: '43'
  , bgBlue: '44'
  , bgMagenta: '45'
  , bgCyan: '46'
  , bgWhite: '47'
}

/**
 * Wraps a string with the specified color token
 *
 * @param {Number} color The color token to wrap the string in
 * @param {String} string The string to be colorized
 *
 * @returns {string} The string containing color tokens
 *
 * @throws {Error} If an invalid color is specified
 */
module.exports.wrap = function (color, string) {
    return '$' + color + '_start$' + string + '$color_end$'
}

/**
 * Turns a colorized string into actual colorized output
 *
 * @param {String} string The string containing color tokens
 * @param {Boolean} [remove=false] True removes the colors from the string, false replaces the tokens with colors
 */
module.exports.tokenize = function (string, remove) {
    if (remove) {
        string = string.replace(/\$(\d\d?)_start\$/g, '')
        return string.replace(/\$color_end\$/g, '')
    }

    string = string.replace(/\$(\d\d?)_start\$/g, '\u001b[$1m')
    return string.replace(/\$color_end\$/g, '\u001b[0m')
}
