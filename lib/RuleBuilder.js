const identity = require('./identity')
const test = require('./test')
const refine = require('./refine')

class RuleBuilder {
  /**
   * @constructor
   * @returns {RuleBuilder}
   */
  constructor() {
    this._rules = []
  }

  /**
   * @public
   * @returns {number}
   */
  get size() {
    return this._rules.length
  }

  /**
   * @public
   * @param {(object|Array<object>)} rule
   * @returns {RuleBuilder}
   */
  addRule(rule) {
    const rules = Array.isArray(rule) ? rule : [rule]

    for (let i = 0, len = rules.length; i < len; i++) {
      const {
        [i]: rule
      } = rules

      if (typeof rule !== 'object' || rule === null) {
        const err = new TypeError(`rules[${i}] expected a non-null object, instead received ${rule}.`)

        throw err
      }

      const {
        use
      } = rule

      if (use === undefined) {
        continue
      }

      if (typeof use !== 'object' || use === null) {
        const err = new TypeError(`rules[${i}].use expected a non-null object, instead received ${use}.`)

        throw err
      }
    }

    this._rules.push(...rules)

    return this
  }

  /**
   * @public
   * @returns {function}
   */
  build() {
    return this._rules.reduceRight((result, x) => (stats) => {
      const {
        path
      } = stats
      const {
        test: ruleTest,
        include,
        exlude
      } = x

      let nextStats

      if (ruleTest instanceof RegExp ? ruleTest.test(path) : ruleTest && test(path, {
        include,
        exlude
      })) {
        const {
          use: {
            mime,
            meta,
            headers
          }
        } = x

        nextStats = {
          ...stats,
          mime: refine(mime, path) || stats.mime,
          meta: {
            ...stats.meta,
            ...refine(meta, path) || {}
          },
          headers: {
            ...stats.headers,
            ...refine(headers, path) || {}
          }
        }
      } else {
        nextStats = stats
      }

      return result(nextStats)
    }, identity)
  }
}

module.exports = RuleBuilder
