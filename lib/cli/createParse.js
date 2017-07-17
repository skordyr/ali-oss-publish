/* eslint-disable no-console */

/**
 * @param {string} name
 * @param {function} fn
 * @returns {any}
 */
function createParse(name, fn) {
  // eslint-disable-next-line consistent-return
  return (source, defaultValue) => {
    try {
      return fn(source, defaultValue, name)
    } catch (err) {
      console.error()
      console.error('  error: parse option "--%s" failed with error: %s ', name, err.message)
      console.error()
      process.exit(1)
    }
  }
}

module.exports = createParse
