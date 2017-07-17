/**
 * @param {function} fn
 * @returns {function:Promise<any>}
 */
function promisify(fn) {
  return function wrapper(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
}

module.exports = promisify
