/**
 * @param {any} x
 * @param {...any} args
 * @returns {any}
 */
function refine(x, ...args) {
  return typeof x === 'function' ? x(...args) : x
}

module.exports = refine
