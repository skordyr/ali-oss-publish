const OSS = require('ali-oss');

class Client {
  /**
   * @constructor
   * @param {object} options
   * @returns {Client}
   */
  constructor(options) {
    this._store = new OSS(options);
  }

  /**
   * @public
   * @returns {object}
   */
  get store() {
    return this._store;
  }

  /**
   * @private
   * @param {?object} query
   * @param {?object} options
   * @param {Array<object>} [results=[]]
   * @returns {Promise<Array<object>>}
   */
  _list(query, options, results = []) {
    return this
      ._store
      .list({
        ...query,
        'max-keys': 1000,
      }, options)
      .then((res) => {
        const {
          objects = [],
          nextMarker,
        } = res;

        const nextResults = [
          ...results,
          ...objects,
        ];

        if (nextMarker) {
          return this._list({
            ...query,
            marker: nextMarker,
          }, options, nextResults);
        }

        return nextResults;
      });
  }

  /**
   * @public
   * @param {?object} query
   * @param {?object} options
   * @returns {Promise<Array<object>>}
   */
  list(query, options) {
    return this._list(query, options);
  }

  /**
   * @public
   * @param {string} name
   * @param {string} filename
   * @param {?object} options
   * @returns {Promise<object>}
   */
  upload(name, filename, options) {
    return this
      ._store
      .put(name, filename, options);
  }

  /**
   * @public
   * @param {string} name
   * @param {?object} options
   * @returns {Promise<object>}
   */
  remove(name, options) {
    return this
      ._store
      .delete(name, options);
  }
}

module.exports = Client;
