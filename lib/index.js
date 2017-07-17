const co = require('co')
const OSS = require('ali-oss')
const debug = require('debug')('ali-oss-publish:main')
const TaskBuilder = require('./TaskBuilder')
const Stats = require('./Stats')

/**
 * @param {object} options
 * @param {function} progresser
 */
function publish(options, progresser) {
  co(function* runner() {
    const taskBuilder = new TaskBuilder(options)
    const ossOptions = taskBuilder.getOSSOptions()
    const store = new OSS(ossOptions)
    let remoteFiles
    let listRemoteWarning
    try {
      debug('list remote files (max: 1000)...')
      const response = yield store.list({
        'max-keys': 1000
      })
      debug('response:')
      debug(response)
      remoteFiles = response.objects
    } catch (err) {
      debug('list remote failed with error:')
      debug(err)
      listRemoteWarning = err.message
      remoteFiles = []
    }

    const {
      total,
      uploads,
      removes
    } = yield taskBuilder.build(remoteFiles)

    let currentStats = new Stats(0, total)

    currentStats.setMessage('list remote resource done.')

    if (listRemoteWarning) {
      currentStats.setWarning(listRemoteWarning)
    }

    progresser(undefined, currentStats)

    for (let index = 0, len = uploads.length; index < len; index++) {
      const {
        name,
        path,
        meta,
        size,
        headers
      } = uploads[index]
      currentStats = currentStats.next()
      try {
        debug('upload %j (%sB): {meta: %j and headers: %j} => %j', path, size, meta, headers, name)
        const response = yield store.put(name, path, {
          meta,
          headers
        })
        debug('response:')
        debug(response)
        currentStats.setMessage('upload "%s" (%sB) to "%s" done.', path, size, name)
      } catch (err) {
        debug('upload failed with error:')
        debug(err)
        currentStats
          .setMessage('upload "%s" (%sB) to "%s" failed.', path, size, name)
          .setError(err)
      }

      progresser(undefined, currentStats)
    }

    for (let index = 0, len = removes.length; index < len; index++) {
      const {
        name,
        size
      } = removes[index]
      currentStats = currentStats.next()
      try {
        debug('remove %s (%sB)', name, size)
        const response = yield store.delete(name)
        debug('response')
        debug(response)
        currentStats.setMessage('remove "%s" (%sB) done.', name, size)
      } catch (err) {
        debug('remove failed with error:')
        debug(err)
        currentStats
          .setMessage('remove "%s" (%sB) failed.', name, size)
          .setWarning(err.message)
      }

      progresser(undefined, currentStats)
    }
  })
  .catch((err) => {
    debug('ali-oss-publish encountered a fatal error:')
    debug(err)
    progresser(err)
  })
}

module.exports = publish
