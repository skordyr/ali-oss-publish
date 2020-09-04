interface ISerializableStats {
  /**
   * message for stats
   */
  message: string
  /**
   * type for stats
   */
  type?: string
  /**
   * concurrency index
   */
  index?: number
  /**
   * current step
   */
  current?: number
  /**
   * total step
   */
  total?: number
  /**
   * warnings for stats
   */
  warnings: string[]
  /**
   * errors for stats
   */
  errors: string[]
}

interface IStats {
  /**
   * message for stats
   */
  readonly message: string
  /**
   * type for stats
   */
  readonly type?: string
  /**
   * concurrency index
   */
  readonly index?: number
  /**
   * current step
   */
  readonly current?: number
  /**
   * total step
   */
  readonly total?: number
  /**
   * warnings for stats
   */
  readonly warings: string[]
  /**
   * errors for stats
   */
  readonly errors: Error[]
  /**
   * ensure whether has progress
   */
  hasProgress(): boolean
  /**
   * ensure whether has warnings
   */
  hasWarnings(): boolean
  /**
   * ensure whether has errors
   */
  hasErrors(): boolean
  toJSON(): ISerializableStats
}

interface IMeta {
  [metaKey: string]: string | number
}

interface IHeaders {
  [headerKey: string]: string | number
}

interface IOperations {
  /**
   * custom mime to the files
   */
  mime?: string | ((filename: string) => string | void)
  /**
   * custom meta to the files
   */
  meta?: IMeta | ((filename: string) => IMeta | void)
  /**
   * custom headers to the files
   */
  headers?: IHeaders | ((filename: string) => IHeaders | void)
}

interface IRule {
  /**
   * match files or the test is true will apply custom operations
   */
  test?: RegExp | boolean
  /**
   * match files will apply custom operations
   */
  include?: RegExp
  /**
   * match files will ignore to apply custom operations
   */
  exclude?: RegExp
  /**
   * custom operations
   */
  use?: IOperations
}

interface IPublishOptions extends IOperations {
  /**
   * accessKeyId in ali oss
   */
  id?: string
  /**
   * accessKeySecret in ali oss
   */
  secret?: string
  /**
   * stsToken in ali oss
   */
  token?: string
  /**
   * region in ali oss
   */
  region?: string
  /**
   * bucket in ali oss
   */
  bucket?: string
  /**
   * entry point, defaults to "."
   */
  entry?: string
  /**
   * match files will publish to ali oss
   */
  include?: RegExp
  /**
   * match files will ignore to publish to ali oss
   */
  exclude?: RegExp,
  /**
   * custom operations options for the match files, defaults to []
   */
  rules?: IRule[],
  /**
   * output path for publish to ali oss, defaults to "."
   */
  output?: string
  /**
   * path to the config file, defaults to try load config from "ali-oss-publish.config.js" when config is not set
   */
  config?: string
  /**
   * retry times when encountered non-fatal errors
   */
  retry?: number
  /**
   * concurrency for publish
   */
  concurrency?: number
  /**
   * force remove the files that not in the publish entry
   */
  force?: boolean
}

interface IPublishCallback {
  /**
   * @param err publish fatal error
   * @param stats publish stats
   */
  (err: Error | null | void, stats?: IStats): void
}

/**
 * @param options publish options
 * @param cb publish callback
 */
export default function publish(options?: IPublishOptions, cb?: IPublishCallback): Promise<void>
export {
  ISerializableStats,
  IStats,
  IMeta,
  IHeaders,
  IOperations as IEffects,
  IRule,
  IPublishOptions,
  IPublishCallback
}
