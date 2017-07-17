class Stats {
  /**
   * @constructor
   * @param {number} current
   * @param {number} total
   * @returns {Stats}
   */
  constructor(current, total) {
    this.current = current
    this.total = total
  }

  /**
   * @public
   * @returns {Stats}
   */
  next() {
    return this.isCompleted() ? null : new Stats(this.current + 1, this.total)
  }

  /**
   * @public
   * @param {string} message
   * @param {Array<any>} args
   * @returns {string}
   */
  format(message, ...args) {
    let index = 0
    return message.replace(/%s/g, () => args[index++])
  }

  /**
   * @public
   * @param {Array<any>} args
   * @returns {Stats}
   */
  setMessage(...args) {
    this.message = this.format(...args)
    return this
  }

  /**
   * @public
   * @param {Array<any>} args
   * @returns {Stats}
   */
  setWarning(...args) {
    this.warning = `Warning: ${this.format(...args)}`
    return this
  }

  /**
   * @public
   * @param {Error} error
   * @returns {Stats}
   */
  setError(error) {
    this.error = `Error: ${error.message}`
    return this
  }

  /**
   * @public
   * @returns {boolean}
   */
  isCompleted() {
    return this.current >= this.total
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasMessage() {
    return !!this.message
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasWarning() {
    return !!this.warning
  }

  /**
   * @public
   * @returns {boolean}
   */
  hasError() {
    return !!this.error
  }

  /**
   * @public
   * @returns {object}
   */
  toJSON() {
    return {
      current: this.current,
      total: this.total,
      message: this.message,
      warning: this.warning,
      error: this.error
    }
  }
}

module.exports = Stats
