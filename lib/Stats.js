class Stats {
  /**
   * @constructor
   * @param {string} message
   * @param {object} [meta={}]
   */
  constructor(message, meta = {}) {
    this._message = message
    this._meta = meta
  }

  /**
   * @public
   * @returns {string}
   */
  get message() {
    return this._message
  }

  /**
   * @public
   * @returns {?string}
   */
  get type() {
    const {
      _meta: {
        type
      }
    } = this

    return type
  }

  /**
   * @public
   * @returns {?number}
   */
  get index() {
    const {
      _meta: {
        index
      }
    } = this

    return index
  }

  /**
   * @public
   * @returns {?number}
   */
  get current() {
    const {
      _meta: {
        current
      }
    } = this

    return current
  }

  /**
   * @public
   * @returns {?number}
   */
  get total() {
    const {
      _meta: {
        total
      }
    } = this

    return total
  }

  /**
   * @public
   * @returns {Array<string>}
   */
  get warnings() {
    const {
      _meta: {
        warnings = []
      }
    } = this

    return warnings
  }

  /**
   * @public
   * @returns {Array<Error>}
   */
  get errors() {
    const {
      _meta: {
        errors = []
      }
    } = this

    return errors
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasProgress() {
    return this.current !== undefined && this.total !== undefined
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasWarnings() {
    return this.warnings.length > 0
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasErrors() {
    return this.errors.length > 0
  }

  /**
   * @public
   * @returns {object}
   */
  toJSON() {
    return {
      message: this.message,
      type: this.type,
      index: this.index,
      current: this.current,
      total: this.total,
      warnings: this.warnings,
      errors: this.errors.map((error) => error.stack)
    }
  }
}

module.exports = Stats
