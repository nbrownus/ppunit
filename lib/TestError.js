var util = require('util')

/**
 * Errors that are generating internally
 * Covers timeout errors and multiple done call errors
 *
 * @param message
 *
 * @constructor
 */
var TestError = function (message) {
    Error.captureStackTrace(this, this)
    this.message = message
    this.errors = []
}

util.inherits(TestError, Error)
TestError.prototype.name = 'TestError'

module.exports = TestError

/**
 * Adds more errors underneath this error
 *
 * @param error
 */
TestError.prototype.addError = function (error) {
    this.errors.push(TestError.convert(error, 'Non error provided: '))
}

/**
 * Converts a possible non error object an error object, prefixing a message if provided
 *
 * @param {*} error The object to possibly convert to an error
 * @param {String} [message] Message to prefix the error object with if converted
 *
 * @returns {TestError|*} The error provided if it was an instance of Error or a TestError object
 */
TestError.convert = function (error, message) {
    if (error instanceof Error === false) {
        message = message || 'done() invoked with non-error: '
        error = new TestError(message + JSON.stringify(error))
    }

    return error
}
