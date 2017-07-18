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
  .option('-i, --id <id>', 'access key you create on aliyun console website')
  .option('-s, --secret <secret>', 'access secret you create on aliyun console website')
  .option('-b, --bucket <bucket>', 'the bucket you want to access')
  .option('-r, --region <region>', 'the bucket data region location')
  .option('-e, --entry <entry>', 'the entry of publish resource')
  .option('-p, --path <path>', 'the path to publish on aliyun')
  .option('-M, --meta <meta>', 'global user meta, will send with "x-oss-meta-" prefix string (JSON string)', createParse('meta', JSON.parse))
  .option('-H, --headers <headers>', 'global extra headers (JSON string)', createParse('headers', JSON.parse))
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
