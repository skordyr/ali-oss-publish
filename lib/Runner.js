const {EventEmitter} = require('events')

/**
 * @var {Object<string, string>}
 */
const EventType = {
  RUN: 'run',
  RETRY: 'retry',
  DONE: 'done',
  TASK_PENDING: 'pending',
  TASK_SUCCEEDED: 'succeeded',
  TASK_FAILED: 'failed'
}

class Runner extends EventEmitter {
  /**
   * @constructor
   * @param {(Task|Array<Task>)} tasks
   * @param {object} [options={}]
   */
  constructor(tasks, options = {}) {
    super()

    const {
      concurrency = 1,
      retry = 0
    } = options

    this._tasks = []
    this._concurrency = concurrency < 1 ? 1 : concurrency
    this._retry = retry < 0 ? 0 : retry
    this._assigned = 0
    this._current = 0
    this._running = false

    this.append(tasks)
  }

  /**
   * @public
   * @returns {boolean}
   */
  get isRunning() {
    return this._running
  }

  /**
   * @public
   * @returns {Array<Task>}
   */
  get tasks() {
    return this._tasks
  }

  /**
   * @public
   * @returns {number}
   */
  get total() {
    return this._tasks.length
  }

  /**
   * @public
   * @returns {number}
   */
  get current() {
    return this._current
  }

  /**
   * @public
   * @returns {Array<Task>}
   */
  get running() {
    return this._tasks.filter((x) => x.isExecuting)
  }

  /**
   * @public
   * @returns {Array<Task>}
   */
  get succeeded() {
    return this._tasks.filter((x) => x.isResolved)
  }

  /**
   * @public
   * @returns {Array<Task>}
   */
  get failed() {
    return this._tasks.filter((x) => x.isRejected)
  }

  /**
   * @public
   * @returns {Array<Task>}
   */
  get completed() {
    return this._tasks.filter((x) => x.isCompleted)
  }

  /**
   * @public
   * @param {(Task|Array<Task>)} task
   * @returns {Runner}
   */
  append(task) {
    const tasks = Array.isArray(task) ? task : [task]

    this._tasks.push(...tasks)

    return this
  }

  /**
   * @public
   * @returns {Runner}
   */
  reset() {
    if (this._running) {
      const err = new Error('Could not call reset while the runner is running.')

      throw err
    }

    this._assigned = 0
    this._current = 0

    return this
  }

  /**
   * @public
   * @returns {Promise}
   */
  run() {
    if (this._running) {
      const err = new Error('Could not call run while the runner is running.')

      return Promise.reject(err)
    }

    this._running = true
    this.emit(EventType.RUN, this)

    return this
      ._run(this._concurrency)
      .then(() => {
        if (this._retry) {
          const {
            failed
          } = this

          if (failed.length) {
            const options = {
              concurrency: this._concurrency,
              retry: this._retry - 1
            }

            const runner = new Runner(failed, options)

            runner.on(EventType.RUN, () => {
              this.emit(EventType.RETRY, 1, this, runner)
            })

            runner.on(EventType.RETRY, (times, runner, child) => {
              this.emit(EventType.RETRY, times + 1, this, child)
            })

            runner.on(EventType.TASK_PENDING, (index, task, runner, child) => {
              this.emit(EventType.TASK_PENDING, index, task, this, child || runner)
            })

            runner.on(EventType.TASK_SUCCEEDED, (index, result, task, runner, child) => {
              this.emit(EventType.TASK_SUCCEEDED, index, result, task, this, child || runner)
            })

            runner.on(EventType.TASK_FAILED, (index, err, task, runner, child) => {
              this.emit(EventType.TASK_FAILED, index, err, task, this, child || runner)
            })

            return runner
              .run()
          }
        }
      })
      .then(() => {
        this._running = false
        this.emit(EventType.DONE, this)
      })
  }

  /**
   * @private
   * @param {number} [concurrency=1]
   * @param {?number} index
   * @returns {Promise}
   */
  _run(concurrency = 1, index) {
    const tasks = this._tasks.slice(this._assigned, this._assigned + concurrency)
    const {
      length: offset
    } = tasks

    if (!offset) {
      return Promise.resolve()
    }

    this._assigned += offset

    return Promise
      .all(tasks.map((x, i) => {
        const nextIndex = index === undefined ? i : index

        return x
          .execute(() => {
            this.emit(EventType.TASK_PENDING, nextIndex, x, this)
          })
          .then((isResolved) => {
            this._current += 1

            if (isResolved) {
              this.emit(EventType.TASK_SUCCEEDED, nextIndex, x.result, x, this)
            } else {
              this.emit(EventType.TASK_FAILED, nextIndex, x.error, x, this)
            }

            return this
              ._run(1, nextIndex)
          })
      }))
  }
}

Runner.EventType = EventType

module.exports = Runner
