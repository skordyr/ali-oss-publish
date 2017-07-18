# ali-oss-publish
[![badge:travis]][build-status]
[![badge:npm-version]][npm-ali-oss-publish]
[![badge:npm-downloads]][npm-ali-oss-publish]
[![badge:issues]][issues]
[![badge:license]][license]

A cli interface of publish resource to [ali-oss][github:ali-oss]

## Installation
To install the stable version:
```bash
npm install ali-oss-publish --save
```
or
```bash
yarn add ali-oss-publish
```

## Usage

### API

#### publish(options: Object, progresser: Function)
publish resource to ali oss
```js
publish({
  config: 'path-to-file-options' // default value: ali-oss-publish.config.js
  id: 'accessKeyId', // ali-oss accessKeyId
  secret: 'accessKeySecret', // ali-oss accessKeySecret
  bucket: 'bucket', // ali-oss bucket
  region: 'region', // ali-oss region
  // user meta
  meta: {
    'ref': 'custom-ref'
  },
  // extra headers
  headers: {
    'Cache-Control': 'max-age=30672000'
  },
  rules: [{
    test: /index\.js$/, // test with upload file path
    // apply mime, meta and headers to match files
    use: {
      mime: 'text/javascript'
      meta: {
        entry: true
      },
      headers: {
        'Cache-control': 'no-cache'
      }
    }
  }]
}, (err, stats) => {
  if (err) {
    // handle fatal error
  }

  console.info('[%s/%s]: %s', stats.current, stats.total, stats.message)

  if (stats.hasError()) {
    console.error(stats.error) // handle error
  }

  if (stats.hasWarning()) {
    console.warn(stats.warning) // handle warning
  }

  if (stats.isCompleted()) {
    // handle completed
  }
})
```
parameters:
* options {Object} publish options
  * config {String} path to file options, default to "ali-oss-publish.config.js"
  * id {String} ali-oss accessKeyId access key you create on aliyun console website see: [ossoptions][github:ali-oss#oss-options]
  * secret {String} ali-oss accessKeySecret access secret you create on aliyun console website see: [ossoptions][github:ali-oss#oss-options]
  * bucket {String} ali-oss bucket bucket you want to access see: [ossoptions][github:ali-oss#oss-options]
  * region {String} ali-oss region the bucket data region location see: [Data Regions][github:ali-oss#data-regions]
  * meta {Object} user meta, will send with x-oss-meta- prefix string
  * headers {Object} extra headers
  * rules {Array\<Object\>} match rule
    * test {RegExp} match regular expression
    * use {Object} apply rule
      * mime {String} custom mime
      * meta {Object} user meta, will send with x-oss-meta- prefix string
      * headers {Object} extra headers
* progresser(err: Error, stats: Stats) {Function} progresser function
  * err {Error} fatal error
  * stats {Stats} stats object
    * current {Number} current task
    * total {Number} total task
    * message {String} progress message
    * warning {String} warning message
    * error {String} error message
    * hasWarning() {Function} test if has warning message
    * hasError() {Function} test if has error message
    * isCompleted() {Function} test if completed

### CLI
```bash
ali-oss-publish [options]
```
#### Options
| Options                    | Default                   | Description                                                                |
|:---------------------------|:--------------------------|:---------------------------------------------------------------------------|
| -V, --version              |                           | output the version number                                                  |
| -c, --config \<config\>    | ali-oss-publish.config.js | path to the config file, default to ali-oss-publish.config.js              |
| -i, --id \<id\>            |                           | access key you create on aliyun console website                            |
| -s, --secret \<secret\>    |                           | access secret you create on aliyun console website                         |
| -b, --bucket \<bucket\>    |                           | the bucket you want to access                                              |
| -r, --region \<region\>    |                           | the bucket data region location                                            |
| -e, --entry \<entry\>      |                           | the entry of publish resource                                              |
| -p, --path \<path\>        |                           | the path to publish on aliyun                                              |
| -M, --meta \<meta\>        |                           | global user meta, will send with "x-oss-meta-" prefix string (JSON string) |
| -H, --headers \<headers\>  |                           | global extra headers (JSON string)                                         |
| -h, --help                 |                           | output usage information                                                   |

### ENV Options
| ENV                     | Option  |
|:------------------------|:--------|
| ALI_OSS_PUBLISH_CONFIG  | config  |
| ALI_OSS_PUBLISH_ID      | id      |
| ALI_OSS_PUBLISH_SECRET  | secret  |
| ALI_OSS_PUBLISH_BUCKET  | bucket  |
| ALI_OSS_PUBLISH_REGION  | region  |
| ALI_OSS_PUBLISH_ENTRY   | entry   |
| ALI_OSS_PUBLISH_PATH    | path    |
| ALI_OSS_PUBLISH_META    | meta    |
| ALI_OSS_PUBLISH_HEADERS | headers |

### File Options
if provide config option, it will load file options from it, and will throw error when file is not exists.
if not provide config option, it will try to load file from ali-oss-publish.config.js, and will ignore error when file is not exists.
```js
module.exports = {
  id: 'accessKeyId', // ali-oss accessKeyId
  secret: 'accessKeySecret', // ali-oss accessKeySecret
  bucket: 'bucket', // ali-oss bucket
  region: 'region', // ali-oss region
  // global user meta
  meta: {
    'ref': 'custom-ref'
  },
  // global extra headers
  headers: {
    'Cache-Control': 'max-age=30672000'
  },
  rules: [{
    test: /index\.js$/, // test with upload file path
    // apply mime, meta and headers to match files
    use: {
      mime: 'text/javascript'
      meta: {
        entry: true
      },
      headers: {
        'Cache-control': 'no-cache'
      }
    }
  }]
}
```

### Options Order
envOptions < fileOptions < paramOptions

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
[github:ali-oss#oss-options]: https://github.com/ali-sdk/ali-oss#ossoptions "OSS Options"
[github:ali-oss#data-regions]: https://github.com/ali-sdk/ali-oss#data-regions "Data Regions"
