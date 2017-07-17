/* eslint-disable no-console */

const commander = require('commander')
const debug = require('debug')('ali-oss-publish:cli')
const publish = require('..')
const pick = require('../utils/pick')
const createParse = require('./createParse')
const pkg = require('../../package.json')

commander
  .version(pkg.version)
  .description('A cli interface of publish resource to ali-oss.')
  .option('-c, --config <config>', 'path to the config file, default to ali-oss-publish.config.js')
  .option('-i, --id <id>', 'ali oss access key id config')
  .option('-s, --secret <secret>', 'ali oss access key secret config')
  .option('-b, --bucket <bucket>', 'ali oss bucket config')
  .option('-r, --region <region>', 'ali oss region config')
  .option('-e, --entry <entry>', 'local resource path')
  .option('-p, --path <path>', 'ali oss publish path')
  .option('-m, --meta <meta>', 'upload file custom meta data', createParse('meta', JSON.parse))
  .option('-h, --headers <headers>', 'upload file custom headers data', createParse('headers', JSON.parse))
  .parse(process.argv)

const options = pick(
  commander,
  ['config', 'id', 'secret', 'bucket', 'region', 'entry', 'path', 'meta', 'headers']
)

Object.entries(options).forEach(([key, value]) => {
  debug('ci.%s:%j => options.%s', key, value, key)
})

const divider = '----------------------------------------'

console.info('ali-oss-publish start...')
console.info(divider)

publish(options, (err, stats) => {
  if (err) {
    console.error('ali-oss-publish encountered a fatal error.')
    console.error(err)
    process.exit(1)
  }

  console.info('[%s/%s]:%s', stats.current, stats.total, stats.message)

  if (stats.hasError()) {
    console.error('ali-oss-publish encountered a error.')
    console.error(stats.error)
    process.exit(1)
  }

  if (stats.hasWarning()) {
    console.warn(stats.warning)
  }

  if (stats.isCompleted()) {
    console.info(divider)
    console.info('ali-oss-publish completed.')
  }
})
