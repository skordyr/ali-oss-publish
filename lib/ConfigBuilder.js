const {resolve} = require('path')

class ConfigBuilder {
  /**
   * @constructor
   * @returns {ConfigBuilder}
   */
  constructor() {
    this._configs = []
  }

  /**
   * @public
   * @returns {number}
   */
  get size() {
    return this._configs.length
  }

  /**
   * @public
   * @param {object} config
   * @returns {ConfigBuilder}
   */
  addRawConfig(config) {
    if (typeof config !== 'object' || config === null) {
      const err = new TypeError(`config expected a non-null object, instead received ${config}.`)

      Object.assign(err, {
        config
      })

      throw err
    }

    const rawConfig = Object
      .entries(config)
      .reduce((result, x) => {
        const [
          key,
          value
        ] = x

        if (value !== undefined) {
          result[key] = value
        }

        return result
      }, {})

    this._configs.push(rawConfig)

    return this
  }

  /**
   * @public
   * @param {object} mapper
   * @returns {ConfigBuilder}
   */
  addEnvConfig(mapper) {
    if (typeof mapper !== 'object' || mapper === null) {
      const err = new TypeError(`mapper expected a non-null object., instead received ${mapper}.`)

      Object.assign(err, {
        mapper
      })

      throw err
    }

    const {
      env
    } = process

    const envConfig = Object
      .entries(mapper)
      .reduce((result, x) => {
        const [
          envKey,
          configKey
         ] = x

         const {
           [envKey]: value
         } = env

         if (value !== undefined) {
           result[configKey] = value
         }

         return result
      }, {})

    this._configs.push(envConfig)

    return this
  }

  /**
   * @public
   * @param {?string} filename
   * @param {?string} defaultFilename
   * @returns {ConfigBuilder}
   */
  addFileConfig(filename, defaultFilename) {
    let config
    let loaded = false

    if (filename) {
      const absoluteFilename = resolve(filename)

      try {
        config = require(absoluteFilename)
        loaded = true
      } catch (e) {
        const err = new Error(`Can not load config in ${absoluteFilename}.`)

        Object.assign(err, {
          filename: absoluteFilename
        })

        throw err
      }
    } else if (defaultFilename) {
      const absoluteFilename = resolve(defaultFilename)

      try {
        config = require(absoluteFilename)
        loaded = true

      // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    if (loaded) {
      return this.addRawConfig(config)
    }

    return this
  }

  /**
   * @public
   * @returns {object}
   */
  build() {
    return this
      ._configs
      .reduce((result, x) => {
        return {
          ...result,
          ...x
        }
      }, {})
  }
}

module.exports = ConfigBuilder
