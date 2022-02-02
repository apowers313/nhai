import * as Logger from "bunyan";
import * as path from "path";
import {Config} from "./Config";
import bunyanDebugStream from "bunyan-debug-stream";

let baseLogger: Logger;
let mainLogger: Log;
let stdoutStream;
let fileStream;

const origConsoleLog = console.log;
const origConsoleTrace = console.trace;
const origConsoleDebug = console.debug;
const origConsoleInfo = console.info;
const origConsoleWarn = console.warn;
const origConsoleError = console.error;

Error.stackTraceLimit = Config.get("log-error-stack-length");

export type LogLevelStrings = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

interface HumanDateTime {
    year: string,
    month: string,
    day: string,
    hour: string,
    minute: string,
    second: string
}

function getHumanDateTime(): HumanDateTime {
    const numericDateTime: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    };

    const ret = new Intl.DateTimeFormat("default", numericDateTime)
        .formatToParts()
        .reduce((acc, v) => Object({... acc, [v.type]: v.value}), {});

    return (ret as HumanDateTime);
}

// eslint-disable-next-line jsdoc/require-jsdoc
export class Log {
    logger: Logger;

    /**
     * Initializes the Logger
     */
    static init(): Log {
        // XXX: for some reason this breaks tests
        // if (mainLogger) {
        //     return mainLogger;
        // }

        // stdout
        stdoutStream = bunyanDebugStream({
            basepath: path.join(__dirname, ".."),
            prefixers: {
                // eslint-disable-next-line
                component: function(val: unknown) {
                    return val;
                },
            },
            colors: {
                fatal: "bgRed",
                trace: "white",
            },
            forceColor: Config.get("log-force-color"),
            showPid: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        // base logger
        baseLogger = Logger.createLogger({
            name: Config.get("app-name"),
            stream: stdoutStream,
            level: Config.get("log-level"),
            src: Config.get("log-src"),
        });

        // file
        if (Config.get("log-file-enabled")) {
            const d = getHumanDateTime();

            fileStream = {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, jsdoc/require-jsdoc
        (console as any).print = (... args: unknown[]) => origConsoleLog(... args);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (console as any).print;
    }

    /**
     * Constructs a child logger with the same attributes as the default logger.
     *
     * @param name - The name of this module, which will be logged with each line.
     */
    constructor(name: string) {
        this.logger = baseLogger.child({component: name});
    }

    /**
     * Log a message at the `fatal` level.
     *
     * @function
     */
    get fatal() {
        return this._fatal.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _fatal(fmt: unknown, ... args: unknown[]) {
        this.logger.fatal(fmt, ... args);
        if (Config.get("log-error-stack")) {
            const t = {};
            Error.captureStackTrace(t);
            this.logger.fatal((t as Error).stack);
        }
    }

    /**
     * Log a message at the `error` level.
     *
     * @function
     */
    get error() {
        return this._error.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _error(fmt: unknown, ... args: unknown[]) {
        this.logger.error(fmt, ... args);
        if (Config.get("log-error-stack")) {
            const t = {};
            Error.captureStackTrace(t);
            this.logger.error((t as Error).stack);
        }
    }

    /**
     * Log a message at the `warn` level.
     *
     * @function
     */
    get warn() {
        return this._warn.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _warn(fmt: unknown, ... args: unknown[]) {
        this.logger.warn(fmt, ... args);
    }

    /**
     * Log a message at the `info` level.
     *
     * @function
     */
    get info() {
        return this._info.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _info(fmt: unknown, ... args: unknown[]) {
        this.logger.info(fmt, ... args);
    }

    /**
     * Log a message at the `debug` level.
     *
     * @function
     */
    get debug() {
        return this._debug.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _debug(fmt: unknown, ... args: unknown[]) {
        this.logger.debug(fmt, ... args);
    }

    /**
     * Log a message at the `trace` level.
     *
     * @function
     */
    get trace() {
        return this._trace.bind(this);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    _trace(fmt: unknown, ... args: unknown[]) {
        this.logger.trace(fmt, ... args);
    }

    /**
     * Returns the logger object created by {@link https://github.com/trentm/node-bunyan|Bunyan}
     *
     * @returns The {@link https://github.com/trentm/node-bunyan#constructor-api|object created by} `createLogger`
     */
    static getBaseLogger(): Logger {
        return baseLogger;
    }

    /**
     * Returns the child logger object named `main`
     *
     * @returns The {@link https://github.com/trentm/node-bunyan#constructor-api|object created by} `createLogger`
     */
    static getMainLogger(): Logger {
        return mainLogger.logger;
    }

    /**
     * Sets the logging level of messages. All messages at or above this level will be logged.
     *
     * @param level A recognized log level string or a number associated with the {@link https://github.com/trentm/node-bunyan#levels|log level}.
     */
    static setStdoutLevel(level: LogLevelStrings | number) {
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
        const s = getStdoutStream();

        return {
            levelName: Log.levelToName(s.level),
            levelValue: s.level,
        };
    }

    /**
     * Adds a stream to the logger. See {@link https://www.npmjs.com/package/bunyan#streams|Bunyan documentation} for details.
     * Note that {@link https://www.npmjs.com/|NPM} has logging streams for nearly any logging service (syslog, CloudWatch, Slack, Logstash, etc.)
     *
     * @param str The stream object to be added, as defined by Bunyan
     */
    static addStream(str: Logger.Stream) {
        mainLogger.logger.addStream(str);
    }

    /**
     * Uses the original `console.log` to write the args to `process.stdout`
     *
     * @function
     * @param args          See {@link https://nodejs.org/api/console.html|Console} for a description of arguments
     */
    static print(... args: undefined[]) {
        return origConsoleLog(... args);
    }

    /**
     * Uses the original `console.error` to write the args to `process.stderr`
     *
     * @function
     * @param args          See {@link https://nodejs.org/api/console.html|Console} for a description of arguments
     */
    static printErr(... args: unknown[]) {
        return origConsoleError(... args);
    }

    /**
     * Log a message at the `fatal` level.
     *
     * @param fmt           See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @param args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     */
    static fatal(fmt: unknown, ... args: unknown[]) {
        mainLogger.fatal(fmt, ... args);
    }

    /**
     * Log a message at the `error` level.
     *
     * @param fmt           See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @param args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     */
    static error(fmt: unknown, ... args: unknown[]) {
        mainLogger.error(fmt, ... args);
    }

    /**
     * Log a message at the `warn` level.
     *
     * @param fmt           See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @param args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     */
    static warn(fmt: unknown, ... args: unknown[]) {
        mainLogger.warn(fmt, ... args);
    }

    /**
     * Log a message at the `info` level.
     *
     * @param fmt           See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @param args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     */
    static info(fmt: unknown, ... args: unknown[]) {
        mainLogger.info(fmt, ... args);
    }

    /**
     * Log a message at the `debug` level.
     *
     * @param fmt           See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @param args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     */
    static debug(fmt: unknown, ... args: unknown[]) {
        mainLogger.debug(fmt, ... args);
    }

    /**
     * Log a message at the `trace` level.
     *
     * @param fmt           See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     * @param args          See {@link https://github.com/trentm/node-bunyan|Bunyan} documentation for a description of possible args
     */
    static trace(fmt: unknown, ... args: unknown[]) {
        mainLogger.trace(fmt, ... args);
    }

    /**
     * Convert name to a logging level number (e.g. "error" -> 50)
     *
     * @param   name The logging level name to convert
     * @returns      The logging level number
     */
    static nameToLevel(name: string) {
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
     * @param level The logging level number to convert
     * @returns      The logging level name
     */
    static levelToName(level: number): LogLevelStrings {
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
    // XXX: apparently Logger.streams is not intended to be public interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {0: s} = (mainLogger.logger as any).streams.filter((s: Logger.Stream) => s.stream === stdoutStream);

    return s;
}
