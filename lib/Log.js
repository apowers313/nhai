const Config = require("./Config");
const bunyan = require("bunyan");

let defaultLogger = bunyan.createLogger({
    name:   Config.get("app-name"),
    stream: process.stdout,
    level:  "info",
    src:    true, // TODO: remove, this is slow
});

/**
 * Application logging utilities
 */
class Log {
    // constructor(name) {
    //     return defaultLogger.child({ module: name });
    // }

    // static setLogger() {
    // }

    // static getLogger() {
    //     return defaultLogger;
    // }

    // static setLevel() {
    // }

    /**
     * Log a message at the `fatal` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static fatal(... args) {
        defaultLogger.fatal(... args);
    }

    /**
     * Log a message at the `error` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static error(... args) {
        defaultLogger.error(... args);
    }

    /**
     * Log a message at the `warn` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static warn(... args) {
        defaultLogger.warn(... args);
    }

    /**
     * Log a message at the `info` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static info(... args) {
        defaultLogger.info(... args);
    }

    /**
     * Log a message at the `debug` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static debug(... args) {
        defaultLogger.debug(... args);
    }

    /**
     * Log a message at the `trace` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static trace(... args) {
        defaultLogger.trace(... args);
    }
}

module.exports = Log;
