/**
 * @param {number} target
 * @param {number} [digits=2]
 * @returns {number}
 */
function fixNumber(target, digits = 2) {
  return target === (target | 0) ? target : Number(target.toFixed(digits))
}

module.exports = fixNumber
