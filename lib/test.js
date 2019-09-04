/**
 * @param {string} str
 * @param {object} [options={}]
 * @returns {boolean}
 */
function test(str, options = {}) {
  const {
    include,
    exclude,
  } = options;

  if (exclude && exclude.test(str)) {
    return false;
  }

  if (include) {
    return include.test(str);
  }

  return true;
}

module.exports = test;
