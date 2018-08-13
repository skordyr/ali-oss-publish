const {promisify} = require('util')
const {stat, readdir} = require('fs')
const {resolve} =require('path')

const test = require('./test')

const statP = promisify(stat)
const readdirP = promisify(readdir)

/**
 * @param {string} entry
 * @param {object} [options={}]
 * @returns {Promise<Array<object>>}
 */
function getEntryStats(entry, options = {}) {
  return statP(entry)
    .then((stats) => {
      if (stats.isFile()) {
        const path = resolve(entry)

        if (test(path, options)) {
          const fileStats = {
            ...stats,
            path
          }

          return [
            fileStats
          ]
        }

        return []
      }

      return readdirP(entry)
        .then((files) => {
          const {
            exclude
          } = options

          return Promise.all(files.reduce((result, x) => {
            const childEntry = resolve(entry, x)

            if (test(childEntry, {exclude})) {
              result.push(getEntryStats(childEntry, options))
            }

            return result
          }, []))
        })
        .then((data) => data.reduce((result, x) => {
          return [
            ...result,
            ...x
          ]
        }, []))
    })
}

module.exports = getEntryStats
