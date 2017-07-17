const fsNative = require('fs')
const pathNative = require('path')
const debug = require('debug')('ali-oss-publish:task-builder')
const id = require('./utils/id')
const pick = require('./utils/pick')
const getAllFiles = require('./utils/getAllFiles')

const DESULT_CONFIG_PATH = 'ali-oss-publish.config.js'
const ENV_OPTIONS_MAP = [
  ['ALI_OSS_PUBLISH_CONFIG', 'config'],
  ['ALI_OSS_PUBLISH_ID', 'id'],
  ['ALI_OSS_PUBLISH_SECRET', 'secret'],
  ['ALI_OSS_PUBLISH_BUCKET', 'bucket'],
  ['ALI_OSS_PUBLISH_REGION', 'region'],
  ['ALI_OSS_PUBLISH_ENTRY', 'entry'],
  ['ALI_OSS_PUBLISH_PATH', 'path'],
  ['ALI_OSS_PUBLISH_META', 'meta'],
  ['ALI_OSS_PUBLISH_HEADERS', 'headers']
]

class TaskBuilder {
  /**
   * @constructor
   * @param {object} options
   * @returns {TaskBuilder}
   */
  constructor(options) {
    const envOptions = pick(
      process.env,
      ENV_OPTIONS_MAP
    )

    ENV_OPTIONS_MAP.forEach(([envKey, key]) => {
      const value = envOptions[key]
      if (value !== undefined) {
        debug('env.%s:%j => options.%s', envKey, value, key)
      }
    })

    const config = pathNative.resolve(options.config || envOptions.config || DESULT_CONFIG_PATH)
    debug('load options from %s', config)
    let fileOptions

    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      fileOptions = require(config)
    } catch (e) {
      if (options.config === undefined && envOptions.config === undefined) {
        debug('load options from default config "%s" failed', DESULT_CONFIG_PATH)
      } else {
        const err = new Error(`cannot load options from "${config}"`)
        throw err
      }
    }

    const finalOptions = Object.assign(
      {},
      envOptions,
      fileOptions,
      options,
      {
        config
      }
    )

    Object.entries(finalOptions).forEach(([key, value]) => {
      debug('%j => final.%s', value, key)
    })

    this.validateOptions(finalOptions)

    this.options = finalOptions
  }

  /**
   * @public
   * @param {object} options
   * @returns {void}
   */
  validateOptions(options) {
    const errors = []
    const {
      id,
      secret,
      bucket,
      region,
      entry,
      path,
      rules
    } = options

    const requiredStringOptions = {
      id,
      secret,
      bucket,
      region,
      path
    }

    Object.entries(requiredStringOptions).forEach(([key, value]) => {
      if (typeof value !== 'string' || value === '') {
        errors.push(
          `option "--${key}" expected a non-empty string, ` +
          `instead received ${JSON.stringify(value)}`
        )
      }
    })

    if (!fsNative.existsSync(entry)) {
      errors.push(`option "--entry" path "${entry}" is not exists`)
    }

    if (rules !== undefined) {
      let error

      if (Array.isArray(rules)) {
        if (rules.some((rule) => {
          const {
            test,
            use
          } = rule

          return !(test instanceof RegExp) || typeof use !== 'object' || use === null
        })) {
          error = true
        }
      } else {
        error = true
      }

      if (error) {
        errors.push(
          'option "rules" expected a array of object which has "test" RegExp property and ' +
          `"use" non-null Object property, instead received ${JSON.stringify(rules)}`
        )
      }
    }

    if (errors.length) {
      const err = new Error(`${errors.join('; ')}.`)
      throw err
    }
  }

  /**
   * @public
   * @returns {function}
   */
  getApplyRule() {
    const {
      options: {
        rules = []
      }
    } = this

    if (!rules.length) {
      return id
    }

    return rules.reduce((applyRule, rule) => (file) => {
      const {
        path
      } = file
      const {
        test,
        use
      } = rule

      let nextFile = file

      if (test.test(path)) {
        nextFile = Object.assign(
          {},
          file,
          {
            meta: Object.assign({}, file.meta, use.meta),
            headers: Object.assign({}, file.headers, use.headers)
          }
        )
      }

      return applyRule(nextFile)
    }, id)
  }

  /**
   * @public
   * @returns {function}
   */
  getNameBuilder() {
    const {
      options: {
        entry,
        path: basePath
      }
    } = this

    return path => pathNative
      .join(basePath, pathNative.relative(entry, path))
      .replace(/\\/g, '/')
      .replace(/^\//, '')
  }

  /**
   * @public
   * @returns {object}
   */
  getOSSOptions() {
    const ossOptions = pick(
      this.options,
      [
        ['id', 'accessKeyId'],
        ['secret', 'accessKeySecret'],
        'bucket',
        'region'
      ]
    )
    return ossOptions
  }

  /**
   * @public
   * @param {Array<object>} remoteFiles
   * @returns {Promise<object>}
   */
  build(remoteFiles) {
    const {
      options: {
        entry,
        meta,
        headers
      }
    } = this

    const applyRule = this.getApplyRule()
    const nameBuilder = this.getNameBuilder()
    const globalUse = {
      meta,
      headers
    }

    debug('list local files...')
    return getAllFiles(entry)
      .then((files) => {
        debug('local files:')
        debug(files)

        debug('build tasks...')
        const uploads = files.map((file) => {
          const task = applyRule(Object.assign(
            {},
            file,
            globalUse,
            {
              name: nameBuilder(file.path)
            }
          ))

          return task
        })
        const removes = remoteFiles.filter((file) => {
          const {
            name
          } = file
          return !uploads.some(task => task.name === name)
        })

        const tasks = {
          total: uploads.length + removes.length,
          uploads,
          removes
        }
        debug('tasks:')
        debug(tasks)

        return tasks
      })
  }
}

module.exports = TaskBuilder
