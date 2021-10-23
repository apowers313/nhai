const path = require("path");

const bunyan = require("bunyan");
const bunyanDebugStream = require("bunyan-debug-stream");

const {Config} = require("./Config");

let baseLogger;
let mainLogger;
let stdoutStream;
let fileStream;

let origConsoleLog = console.log;
let origConsoleTrace = console.trace;
let origConsoleDebug = console.debug;
let origConsoleInfo = console.info;
let origConsoleWarn = console.warn;
let origConsoleError = console.error;

Error.stackTraceLimit = Config.get("log-error-stack-length");

/**
 * Application logging utilities
 */
class Log {
    /**
     * Initializes the Logger
     */
    static init() {
        // XXX: for some reason this breaks tests
        // if (mainLogger) {
        //     return mainLogger;
        // }

        // stdout
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

        // base logger
        baseLogger = bunyan.createLogger({
            name: Config.get("app-name"),
            stream: stdoutStream,
            level: Config.get("log-level"),
            src: Config.get("log-src"),
        });

        // file
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
                level: Config.get("log-file-level"),
            };
            baseLogger.addStream(fileStream);
        }

        // patch console
        if (Config.get("log-patch-console")) {
            Log.patch();
        }

        // main logger
        mainLogger = new Log("main");

        return mainLogger;
    }

    /**
     * Patches `console.log` (and kin) to use Log
     */
    static patch() {
        console.log = Log.debug;
        console.trace = Log.trace;
        console.debug = Log.debug;
        console.info = Log.info;
        console.warn = Log.warn;
        console.error = Log.error;
        console.print = (... args) => origConsoleLog(... args);
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
        delete console.print;
    }

    /**
     * Constructs a child logger with the same attributes as the default logger.
     *
     * @param {string} name - The name of this module, which will be logged with each line.
     */
    constructor(name) {
        this.logger = baseLogger.child({component: name});
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
        if (Config.get("log-error-stack")) {
            let t = {};
            Error.captureStackTrace(t);
            this.logger.fatal(t.stack);
        }
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
        if (Config.get("log-error-stack")) {
            let t = {};
            Error.captureStackTrace(t);
            this.logger.error(t.stack);
        }
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
    static getBaseLogger() {
        return baseLogger;
    }

    /**
     * Returns the child logger object named `main`
     *
     * @returns {object} The {@link https://github.com/trentm/node-bunyan#constructor-api|object created by} `createLogger`
     */
    static getMainLogger() {
        return mainLogger.logger;
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
        mainLogger.logger.addStream(obj);
    }

    /**
     * Uses the original `console.log` to write the args to `process.stdout`
     *
     * @function
     * @param   {...*}  args          See {@link https://nodejs.org/api/console.html|Console} for a description of arguments
     * @returns {undefined}     No return
     */
    static print(... args) {
        return origConsoleLog(... args);
    }

    /**
     * Uses the original `console.error` to write the args to `process.stderr`
     *
     * @function
     * @param   {...*}  args          See {@link https://nodejs.org/api/console.html|Console} for a description of arguments
     * @returns {undefined}     No return
     */
    static printErr(... args) {
        return origConsoleError(... args);
    }

    /**
     * Log a message at the `fatal` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static fatal(... args) {
        mainLogger.fatal(... args);
    }

    /**
     * Log a message at the `error` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static error(... args) {
        mainLogger.error(... args);
    }

    /**
     * Log a message at the `warn` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static warn(... args) {
        mainLogger.warn(... args);
    }

    /**
     * Log a message at the `info` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static info(... args) {
        mainLogger.info(... args);
    }

    /**
     * Log a message at the `debug` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static debug(... args) {
        mainLogger.debug(... args);
    }

    /**
     * Log a message at the `trace` level.
     *
     * @param   {...*}  args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @returns {undefined}     No return
     */
    static trace(... args) {
        mainLogger.trace(... args);
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
    let {0: s} = mainLogger.logger.streams.filter((s) => s.stream === stdoutStream);

    return s;
}

module.exports = Log;
