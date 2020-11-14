const path = require("path");

const bunyan = require("bunyan");
const bunyanDebugStream = require("bunyan-debug-stream");

const {Config} = require("./Config");

let defaultLogger;
let stdoutStream;
let fileStream;

let origConsoleLog = console.log;
let origConsoleTrace = console.trace;
let origConsoleDebug = console.debug;
let origConsoleInfo = console.info;
let origConsoleWarn = console.warn;
let origConsoleError = console.error;

/**
 * Application logging utilities
 */
class Log {
    /**
     * Initializes the Logger
     */
    static async init() {
        stdoutStream = bunyanDebugStream({
            basepath: path.join(__dirname, ".."),
            prefixers: {
                component: function(val) {
                    return val;
                },
            },
            colors: {
                fatal: "bgRed",
                trace: "white",
            },
            forceColor: Config.get("log-force-color"),
            showPid: false,
        });

        defaultLogger = bunyan.createLogger({
            name: Config.get("app-name"),
            stream: stdoutStream,
            level: Config.get("log-level"),
            src: Config.get("log-src"),
        });

        if (Config.get("log-file-enabled")) {
            let numericDateTime = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            };
            let d = new Intl.DateTimeFormat("default", numericDateTime)
                .formatToParts()
                .reduce((acc, v) => Object({... acc, [v.type]: v.value}), {});

            fileStream = {
                path: `${Config.get("log-file-path")}/${Config.get("log-file-prefix")}-${d.year}${d.month}${d.day}-${d.hour}${d.minute}${d.second}${Config.get("log-file-suffix")}`,
                level: "trace",
            };
            defaultLogger.addStream(fileStream);
        }

        if (Config.get("log-patch-console")) {
            Log.patch();
        }

        return defaultLogger;
    }

    /**
     * Patches `console.log` (and kin) to use Log
     */
    static patch() {
        console.log = Log.trace;
        console.trace = Log.trace;
        console.debug = Log.debug;
        console.info = Log.info;
        console.warn = Log.warn;
        console.error = Log.error;
    }

    /**
     * After calling {@link Log.patch}, returns `console.log` (and kin) to its original state
     */
    static unpatch() {
        console.log = origConsoleLog;
        console.trace = origConsoleTrace;
        console.debug = origConsoleDebug;
        console.info = origConsoleInfo;
        console.warn = origConsoleWarn;
        console.error = origConsoleError;
    }

    /**
     * Constructs a child logger with the same attributes as the default logger.
     *
     * @param {string} name - The name of this module, which will be logged with each line.
     */
    constructor(name) {
        this.logger = defaultLogger.child({component: name});
    }

    /**
     * Log a message at the `fatal` level.
     *
     * @function
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    get fatal() {
        return this._fatal.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _fatal(... args) {
        this.logger.fatal(... args);
    }

    /**
     * Log a message at the `error` level.
     *
     * @function
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    get error() {
        return this._error.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _error(... args) {
        this.logger.error(... args);
    }

    /**
     * Log a message at the `warn` level.
     *
     * @function
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    get warn() {
        return this._warn.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _warn(... args) {
        this.logger.warn(... args);
    }

    /**
     * Log a message at the `info` level.
     *
     * @function
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    get info() {
        return this._info.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _info(... args) {
        this.logger.info(... args);
    }

    /**
     * Log a message at the `debug` level.
     *
     * @function
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    get debug() {
        return this._debug.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _debug(... args) {
        this.logger.debug(... args);
    }

    /**
     * Log a message at the `trace` level.
     *
     * @function
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    get trace() {
        return this._trace.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _trace(... args) {
        this.logger.trace(... args);
    }

    /**
     * Returns the logger object created by {@link https://github.com/trentm/node-bunyan|Bunyan}
     *
     * @returns {object} The {@link https://github.com/trentm/node-bunyan#constructor-api|object created by} `createLogger`
     */
    static getLogger() {
        return defaultLogger;
    }

    /**
     * Sets the logging level of messages. All messages at or above this level will be logged.
     *
     * @param {"trace" | "debug" | "info" | "warn" | "error" | "fatal" | number} level A recognized log level string or a number associated with the {@link https://github.com/trentm/node-bunyan#levels|log level}.
     */
    static setStdoutLevel(level) {
        if (typeof level === "string") {
            level = Log.nameToLevel(level);
        }

        if ((typeof level !== "number") ||
            (level > 60) ||
            (level < 10) ||
            ((level % 10) !== 0)) {
            throw new TypeError("setStdoutLevel expected level to be a number and a multiple of 10 between 0 and 61");
        }

        getStdoutStream().level = level;
    }

    /**
     * Gets the current logging level for the default stdout stream.
     *
     * @returns {object} An object describing the current logging level. Properties are `levelName`, a string describing the current log level name
     * and `levelValue` a corresponding number for the current log level.
     */
    static getStdoutLevel() {
        let s = getStdoutStream();

        return {
            levelName: Log.levelToName(s.level),
            levelValue: s.level,
        };
    }

    /**
     * Adds a stream to the logger. See {@link https://www.npmjs.com/package/bunyan#streams|Bunyan documentation} for details.
     * Note that {@link https://www.npmjs.com/|NPM} has logging streams for nearly any logging service (syslog, CloudWatch, Slack, Logstash, etc.)
     *
     * @param {object} obj The stream object to be added.
     */
    static addStream(obj) {
        defaultLogger.addStream(obj);
    }

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

    /**
     * Convert name to a logging level number (e.g. "error" -> 50)
     *
     * @param   {string} name The logging level name to convert
     * @returns {number}      The logging level number
     */
    static nameToLevel(name) {
        switch (name) {
        case "trace": return 10;
        case "debug": return 20;
        case "info": return 30;
        case "warn": return 40;
        case "error": return 50;
        case "fatal": return 60;
        default: throw new TypeError(`unknown log level name: ${name}`);
        }
    }

    /**
     * Convert logging level number to a name (e.g. 50 -> "error")
     *
     * @param {number} level The logging level number to convert
     * @returns {number}      The logging level name
     */
    static levelToName(level) {
        switch (level) {
        case 10: return "trace";
        case 20: return "debug";
        case 30: return "info";
        case 40: return "warn";
        case 50: return "error";
        case 60: return "fatal";
        default: throw new TypeError(`unknown level: ${level}`);
        }
    }
}

function getStdoutStream() {
    let {0: s} = defaultLogger.streams.filter((s) => s.stream === stdoutStream);

    return s;
}

module.exports = Log;
