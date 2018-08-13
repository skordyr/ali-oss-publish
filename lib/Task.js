class Task {
  /**
   * @constructor
   * @param {function} executor
   * @param {any} meta
   * @returns {Task}
   */
  constructor(executor, meta) {
    this._executor = executor
    this._meta = meta
    this._executing = false
    this._result = null
    this._error = null
  }

  /**
   * @public
   * @returns {boolean}
   */
  get isExecuting() {
    return this._executing
  }

  /**
   * @public
   * @returns {boolean}
   */
  get isResolved() {
    return !this._executing && this._result !== null
  }

  /**
   * @public
   * @returns {boolean}
   */
  get isRejected() {
    return !this._executing && this._error !== null
  }

  /**
   * @public
   * @returns {boolean}
   */
  get isCompleted() {
    return !this._executing && (this._result !== null || this._error !== null)
  }

  /**
   * @public
   * @returns {function}
   */
  get executor() {
    return this._executor
  }

  /**
   * @public
   * @returns {any}
   */
  get meta() {
    return this._meta
  }

  /**
   * @public
   * @returns {any}
   */
  get result() {
    return this._result
  }

  /**
   * @public
   * @returns {(null|Error)}
   */
  get error() {
    return this._error
  }

  /**
   * @public
   * @param {?function} onExecuting
   * @returns {Promise<boolean>}
   */
  execute(onExecuting) {
    if (this._executing) {
      const err = new Error('Could not call execute while the task is executing.')

      return Promise.reject(err)
    }

    return new Promise((resolve) => {
      this._result = null
      this._error = null
      this._executing = true

      if (onExecuting) {
        onExecuting()
      }

      resolve(this._executor(this._meta))
    })
    .then((result) => {
      this._result = result
      this._executing = false

      return true
    })
    .catch((err) => {
      this._error = err
      this._executing = false

      return false
    })
  }

  /**
   * @public
   * @returns {object}
   */
  toJSON() {
    return {
      executor: this._executor,
      meta: this._meta,
      result: this._result,
      error: this._error
    }
  }
}

module.exports = Task
