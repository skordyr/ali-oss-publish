const fsNative = require('fs')
const pathNative = require('path')
const promisify = require('./promisify')

const stat = promisify(fsNative.stat)
const readdir = promisify(fsNative.readdir)

/**
 * @param {string} path
 * @param {object} options
 * @returns {Array<object>}
 */
function getAllFiles(path, options) {
  return stat(path)
    .then((stats) => {
      if (stats.isFile()) {
        const fileStats = Object.assign({ path }, stats)
        return [fileStats]
      }

      return readdir(path, options)
        .then(files => Promise.all(
          files.map(file => getAllFiles(
            pathNative.join(path, file),
            options
          ))
        ))
        .then(data => data.reduce((acc, fileStatsSet) => [...acc, ...fileStatsSet]))
    })
}

module.exports = getAllFiles
