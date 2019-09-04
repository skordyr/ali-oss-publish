const { relative, join } = require('path');

const noop = require('./lib/noop');
const fixNumber = require('./lib/fixNumber');
const getEntryStats = require('./lib/getEntryStats');
const ConfigBuilder = require('./lib/ConfigBuilder');
const RuleBuilder = require('./lib/RuleBuilder');
const Runner = require('./lib/Runner');
const Task = require('./lib/Task');
const Client = require('./lib/Client');
const Stats = require('./lib/Stats');

/**
 * @var {Object<string, string>}
 */
const mapper = {
  ALI_OSS_PUBLISH_ID: 'id',
  ALI_OSS_PUBLISH_SECRET: 'secret',
  ALI_OSS_PUBLISH_REGION: 'region',
  ALI_OSS_PUBLISH_BUCKET: 'bucket',
  ALI_OSS_PUBLISH_ENTRY: 'entry',
  ALI_OSS_PUBLISH_OUTPUT: 'output',
};

/**
 * @param {number} size
 * @returns {string}
 */
function prettyFileSize(size) {
  return fixNumber(size / 1024, 2).toLocaleString();
}

/**
 * @param {!object} options
 * @param {?string} defaultFilename
 * @returns {object>}
 */
function resolveConfig(options, defaultFilename) {
  const {
    config: filename,
    ...rawConfig
  } = options;

  const config = new ConfigBuilder()
    .addEnvConfig(mapper)
    .addFileConfig(filename, defaultFilename)
    .addRawConfig(rawConfig)
    .build();

  return config;
}

/**
 * @param {object} [options={}]
 * @returns {function}
 */
function resolveRule(options = {}) {
  const {
    mime,
    meta,
    headers,
    rules = [],
  } = options;

  const rule = new RuleBuilder()
    .addRule({
      test: true,
      use: {
        mime,
        meta,
        headers,
      },
    })
    .addRule(rules)
    .build();

  return rule;
}

/**
 * @param {string} output
 * @returns {string}
 */
function resolveOutput(output) {
  return join(output, '.')
    .replace(/^[./\\]+/, '');
}

/**
 * @param {string} output
 * @param {string} entry
 * @param {string} path
 * @returns {string}
 */
function resolveName(output, entry, path) {
  return join(output, relative(entry, path))
    .replace(/\\+/g, '/')
    .replace(/^\//, '');
}

/**
 * @param {object} [options={}]
 * @param {function} [cb=noop]
 * @returns {Promise}
 */
function publish(options = {}, cb = noop) {
  return Promise
    .resolve()
    .then(() => {
      const {
        id: accessKeyId,
        secret: accessKeySecret,
        region,
        bucket,
        entry = '.',
        include,
        exclude,
        mime,
        meta,
        headers,
        rules = [],
        output = '.',
        force,
        retry,
        concurrency,
      } = resolveConfig(options, 'ali-oss-publish.config.js');

      const rule = resolveRule({
        mime,
        meta,
        headers,
        rules,
      });
      const client = new Client({
        accessKeyId,
        accessKeySecret,
        region,
        bucket,
      });
      const message = `publish ({ bucket: "${bucket}", region: "${region}" }) start...`;
      const stats = new Stats(message);

      cb(null, stats);

      return Promise.all([
        getEntryStats(entry, {
          include,
          exclude,
        }),
        force
          ? client.list()
          : Promise.resolve([]),
      ])
        .then((data) => {
          const [
            localFilesStats,
            remoteFilesStats,
          ] = data;

          const uploadFilesStats = localFilesStats.map((x) => {
            const {
              path,
            } = x;

            const name = resolveName(output, entry, path);

            return {
              ...rule(x),
              name,
            };
          });

          const uploadTasks = uploadFilesStats.map((x) => new Task((x) => {
            const {
              path,
              name,
              mime,
              meta,
              headers,
            } = x;

            return client.upload(name, path, {
              mime,
              meta,
              headers,
            });
          }, x));

          const runner = new Runner(uploadTasks, {
            retry,
            concurrency,
          });
          runner.on('run', (runner) => {
            const {
              total,
            } = runner;

            const message = `upload (${total}) start...`;
            const stats = new Stats(message);

            cb(null, stats);
          });
          runner.on('retry', (times, runner, child) => {
            const {
              total,
            } = child;

            const message = `retry upload #${times} (${total}) start...`;
            const stats = new Stats(message);

            cb(null, stats);
          });
          runner.on('done', (runner) => {
            const {
              succeeded: {
                length: succeeded,
              },
              total,
            } = runner;

            if (succeeded < total) {
              const err = new Error(`Upload ${succeeded} of ${total}.`);

              cb(err);

              return;
            }

            const message = `upload (${succeeded}/${total}) done.`;
            const stats = new Stats(message);

            cb(null, stats);
          });
          runner.on('succeeded', (index, result, task, runner, child) => {
            const {
              meta: {
                path,
                name,
                size,
              },
            } = task;
            const {
              current,
              total,
            } = runner;

            const message = `upload "${path}" (${prettyFileSize(size)} KB) to "${name}" done.`;
            const type = child ? 'upload(r)' : 'upload';
            const stats = new Stats(message, {
              type,
              index,
              current,
              total,
            });

            cb(null, stats);
          });
          runner.on('failed', (index, err, task, runner, child) => {
            const {
              meta: {
                path,
                name,
                size,
              },
            } = task;
            const {
              current,
              total,
            } = runner;

            const message = `upload "${path}" (${prettyFileSize(size)} KB) to "${name}" failed.`;
            const type = child ? 'upload(r)' : 'upload';
            const stats = new Stats(message, {
              type,
              index,
              current,
              total,
              errors: [err],
            });

            cb(null, stats);
          });

          return runner
            .run()
            .then(() => {
              const prefix = resolveOutput(output);
              const removeTasks = remoteFilesStats.reduce((result, x) => {
                const {
                  name,
                } = x;

                if ((prefix === '' || name.indexOf(`${prefix}/`) === 0) && uploadFilesStats.every((x) => x.name !== name)) {
                  const task = new Task((x) => {
                    const {
                      name,
                    } = x;

                    return client.remove(name);
                  }, x);

                  result.push(task);
                }

                return result;
              }, []);

              if (!removeTasks.length) {
                return undefined;
              }

              const runner = new Runner(removeTasks, {
                retry,
                concurrency,
              });
              runner.on('run', (runner) => {
                const {
                  total,
                } = runner;

                const message = `remove (${total}) start...`;
                const stats = new Stats(message);

                cb(null, stats);
              });
              runner.on('retry', (times, runner, child) => {
                const {
                  total,
                } = child;

                const message = `retry remove #${times} (${total}) start...`;
                const stats = new Stats(message);

                cb(null, stats);
              });
              runner.on('done', (runner) => {
                const {
                  succeeded: {
                    length: succeeded,
                  },
                  total,
                } = runner;

                const message = `remove (${succeeded}/${total}) done.`;
                const warnings = succeeded < total ? [`Warning: remove ${succeeded} of ${total}.`] : [];
                const stats = new Stats(message, {
                  warnings,
                });

                cb(null, stats);
              });
              runner.on('succeeded', (index, result, task, runner, child) => {
                const {
                  meta: {
                    name,
                  },
                } = task;
                const {
                  current,
                  total,
                } = runner;

                const message = `remove "${name}" done.`;
                const type = child ? 'remove(r)' : 'remove';
                const stats = new Stats(message, {
                  type,
                  index,
                  current,
                  total,
                });

                cb(null, stats);
              });
              runner.on('failed', (index, err, task, runner, child) => {
                const {
                  meta: {
                    name,
                  },
                } = task;
                const {
                  current,
                  total,
                } = runner;

                const message = `remove "${name}" failed.`;
                const type = child ? 'remove(r)' : 'remove';
                const stats = new Stats(message, {
                  type,
                  index,
                  current,
                  total,
                  errors: [err],
                });

                cb(null, stats);
              });

              return runner
                .run();
            });
        })
        .then(() => {
          const message = `publish ({ bucket: "${bucket}", region: "${region}" }) done.`;
          const stats = new Stats(message);

          cb(null, stats);
        });
    })
    .catch((err) => {
      cb(err);
    });
}

module.exports = publish;
