/* eslint-disable no-console */

const chalk = require('chalk')
const commander = require('commander')

const publish = require('..')

const {
  version,
  description
} = require('../package.json')

const divider = '------------------------'

commander
  .version(version)
  .description(description)
  .option('-i, --id <id>', 'accessKeyId in ali oss')
  .option('-s, --secret <secret>', 'accessKeySecret in ali oss')
  .option('-r, --region <region>', 'region in ali oss')
  .option('-b, --bucket <bucket>', 'bucket in ali oss')
  .option('-e, --entry <entry>', 'entry point, defaults to "."')
  .option('-o, --output <output>', 'output path for publish to ali oss, defaults to "."')
  .option('-c, --config <config>', 'path to the config file, defaults to try load config from "ali-oss-publish.config.js" when config is not set')
  .option('--retry <retry>', 'retry times when encountered non-fatal errors', Number)
  .option('--concurrency <concurrency>', 'concurrency for publish', Number)
  .option('--force', 'force remove the files that not in the publish entry')
  .parse(process.argv)

const {
  id,
  secret,
  region,
  bucket,
  entry,
  output,
  config,
  retry,
  concurrency,
  force
} = commander

const options = {
  id,
  secret,
  region,
  bucket,
  entry,
  output,
  config,
  retry,
  concurrency,
  force
}

publish(options, (err, stats) => {
  if (err) {
    console.error(chalk.red('ali-oss-publish encountered a fatal error.'))
    console.error(chalk.red(err.stack))

    process.exit(1)
  }

  if (stats.hasProgress()) {
    const {
      type,
      index,
      current,
      total,
      message
    } = stats

    if (current === 1) {
      console.log(divider)
    }

    console.log(chalk.green('[%s] [%s/%s] [#%s]: %s'), type, current, total, index, message)

    if (current === total) {
      console.log(divider)
    }
  } else {
    console.log(stats.message)
  }

  if (stats.hasWarnings()) {
    console.warn(chalk.yellow('ali-oss-publish encountered some warnings.'))
    stats.warnings.forEach((x) => {
      console.warn(chalk.yellow(x))
    })
  }

  if (stats.hasErrors()) {
    console.error(chalk.red('ali-oss-publish encountered some errors.'))
    stats.errors.forEach((x) => {
      console.error(chalk.red(x.stack))
    })
  }
})
