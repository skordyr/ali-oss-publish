# ali-oss-publish
[![badge:travis]][build-status]
[![badge:npm-version]][npm-ali-oss-publish]
[![badge:npm-downloads]][npm-ali-oss-publish]
[![badge:issues]][issues]
[![badge:license]][license]

a cli interface of publish resources to [ali-oss][github:ali-oss]

## Installation

```bash
yarn add ali-oss-publish
```

## Api

### publish: function(options: object[, cb: function(err: Error, stats: Stats)]): Promise

* `options: object`: publish options
  * `options.id: string`: accessKeyId in ali oss, see [ali-oss-options][github:ali-oss#oss-options]
  * `options.secret: string`: accessKeySecret in ali oss, see [ali-oss-options][github:ali-oss#oss-options]
  * `options.token: string`: stsToken in ali oss, see [ali-oss-options][github:ali-oss#oss-options]
  * `options.region: string,`: region in ali oss, see [ali-oss-options][github:ali-oss#oss-options]
  * `options.bucket: string,`: bucket in ali oss, see [ali-oss-options][github:ali-oss#oss-options]
  * `options.entry = '.': string`: entry point, defaults to "."
  * `options.include: ?RegExp`: match files will publish to ali oss
  * `options.exclude: ?RegExp`: match files will ignore to publish to ali oss
  * `options.mime: ?(string|function(path: string): string|void)`: custom mime to all files, see [ali-oss-put-file-options][github:ali-oss#put-file-options]
  * `options.meta: ?(object|function(path: string): object|void)`: custom meta to all files, see [ali-oss-put-file-options][github:ali-oss#put-file-options]
  * `options.headers: ?(object|function(path: string): object|void)`: custom headers to all files, see [ali-oss-put-file-options][github:ali-oss#put-file-options]
  * `options.rules = []: Array<object>`: custom operations options for the match files, defaults to []
    * `options.rules[].test: ?RegExp|boolean`: match files or the test is true will apply custom operations
    * `options.rules[].include: ?RegExp`: match files will apply custom operations
    * `options.rules[].exclude: ?RegExp`: match files will ignore to apply custom operations
    * `options.rules[].use: ?object`: custom operations
      * `options.rules[].use.mime: ?(string|function(path: string): string|void)`: custom mime to the match files, see [ali-oss-put-file-options][github:ali-oss#put-file-options]
      * `options.rules[].use.meta: ?(object|function(path: string): object|void)`: custom meta to the match files, see [ali-oss-put-file-options][github:ali-oss#put-file-options]
      * `options.rules[].use.headers: ?(object|function(path: string): object|void)`: custom headers to the match files, see [ali-oss-put-file-options][github:ali-oss#put-file-options]
  * `options.output = '.': string`: output path for publish to ali oss, defaults to "."
  * `options.force: boolean`: force remove the files that not in the publish entry
  * `options.config: string`: path to the config file, defaults to try load config from "ali-oss-publish.config.js" when config is not set
  * `options.retry: ?number`: retry times when encountered non-fatal errors
  * `options.concurrency: ?number`: concurrency for publish
* `cb = noop: function(err: Error[, stats: Stats])`: callback function, defaults to noop
  * `err: Error`: fatal error
  * `stats: Stats`: publish stats
    * `stats.message: string`: message for stats
    * `stats.type: ?string`: type for stats
    * `stats.index: ?number`: concurrency index
    * `stats.current: ?number`: current step
    * `stats.total: ?number`: total step
    * `stats.warnings: ?Array<string>`: warnings for stats
    * `stats.errors: ?Array<Error>`: errors for stats
    * `stats.hasProgress: function(): boolean`: ensure whether has progress
    * `stats.hasWarnings: function(): boolean`: ensure whether has warnings
    * `stats.hasErrors: function(): boolean`: ensure whether has errors
* **Returns** `Promise`: promise

```js
const publish = require('ali-oss-publish')

publish({
  id: 'accessKeyId-in-ali-oss-options',
  secret: 'accessKeySecret-in-ali-oss-options',
  token: 'stsToken-in-ali-oss-options',
  region: 'region-in-ali-oss-options',
  bucket: 'bucket-in-ali-oss-options',
  entry: '/path/to/publish/files', // defaults to '.'
  include: /bin|cli|lib|index\.js$|\.md$/,
  exclude: /.DS_Store$/,
  mime: (filename) => {
    if (/\.md$/.test(filename)) {
      return 'text/markdown'
    }

    return undefined
  },
  meta: {
    ref: Date.now()
  },
  headers: {
    'Cache-Control': 'max-age=30672000'
  },
  rules: [{
    test: /(index\.html|service-worker\.js)$/,
    use: {
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  }],
  output: '/path/to/ali-oss/to/publish',
  config: '/path/to/config/file.js', // defaults to try load config from 'ali-oss-publish.config.js' when config is not set
  retry: 1,
  concurrency: 4,
  force: true
}, (err, stats) => {
  if (err) {
    console.error('ali-oss-publish encountered a fatal error.')
    console.error(err)

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

    console.log('[%s] [%s/%s] #%s: %s', type, current, total, index, message)
  } else {
    console.log(stats.message)
  }

  if (stats.hasWarnings()) {
    console.warn('ali-oss-publish encountered some warnings.')
    stats.warnings.forEach((x) => {
      console.warn(x)
    })
  }

  if (stats.hasErrors()) {
    console.error('ali-oss-publish encountered some errors.')
    stats.errors.forEach((x) => {
      console.error(x)
    })
  }
})
```

## Cli

```
  Usage: ali-oss-publish [options]

  a cli interface of publish resources to ali oss

  Options:
    -V, --version                output the version number
    -i, --id <id>                accessKeyId in ali oss
    -s, --secret <secret>        accessKeySecret in ali oss
    -t, --token <token>          stsToken in ali oss
    -r, --region <region>        region in ali oss
    -b, --bucket <bucket>        bucket in ali oss
    -e, --entry <entry>          entry point, defaults to "."
    -o, --output <output>        output path for publish to ali oss, defaults to "."
    -c, --config <config>        path to the config file, defaults to try load config from "ali-oss-publish.config.js" when config is not set
    --retry <retry>              retry times when encountered non-fatal errors
    --concurrency <concurrency>  concurrency for publish
    --force                      force remove the files that not in the publish entry
    -h, --help                   display help for command
```

## Environment

 Env Name               | Config Name
------------------------|-------------
 ALI_OSS_PUBLISH_ID     | id
 ALI_OSS_PUBLISH_SECRET | secret
 ALI_OSS_PUBLISH_TOKEN  | token
 ALI_OSS_PUBLISH_REGION | regin
 ALI_OSS_PUBLISH_BUCKET | bucket
 ALI_OSS_PUBLISH_ENTRY  | entry
 ALI_OSS_PUBLISH_OUTPUT | output

## Config File

```js
module.exports = {
  // publish options
}
```

## Options Override

EnvOptions < FileOptions < ParamsOptions

[badge:issues]: https://img.shields.io/github/issues/skordyr/ali-oss-publish.svg "Issues"
[badge:license]: https://img.shields.io/badge/license-MIT-blue.svg "License"
[badge:travis]: https://img.shields.io/travis/skordyr/ali-oss-publish.svg "Build Status"
[badge:npm-version]: https://img.shields.io/npm/v/ali-oss-publish.svg "NPM Version"
[badge:npm-downloads]: https://img.shields.io/npm/dm/ali-oss-publish.svg "NPM Downloads"

[issues]: https://github.com/skordyr/ali-oss-publish/issues "Issues"
[license]: https://raw.githubusercontent.com/skordyr/ali-oss-publish/master/LICENSE "License"
[build-status]: https://travis-ci.org/skordyr/ali-oss-publish "Build Status"
[npm-ali-oss-publish]: https://www.npmjs.com/package/ali-oss-publish "ali-oss-publish"

[github:ali-oss]: https://github.com/ali-sdk/ali-oss "aliyun OSS(open storage service) nodejs client"
[github:ali-oss#oss-options]: https://github.com/ali-sdk/ali-oss#ossoptions "Ali OSS Options"
[github:ali-oss#put-file-options]: https://github.com/ali-sdk/ali-oss#putname-file-options "Ali OSS Put File Options"
