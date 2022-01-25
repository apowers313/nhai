/**
 * The program can be configured with a rc file such as .nhairc, .nhairc.js, .nhairc.yml, etc.
 * see {@link https://www.npmjs.com/package/cosmiconfig|cosmiconfig} for allowed file names.
 * This is documentation for the various config options.
 *
 * @module Config
 */

const path = require("path");
let {cosmiconfigSync} = require("cosmiconfig");
const cosmiconfigOpts = {};

const defaultConfigMap = new Map(
    [
        /**
         * Name of the application, mostly for cosmetic purposes.
         *
         * @name app-name
         * @type {string}
         * @default nhai
         */
        ["app-name", "nhai"],
        /**
         * Version of the application picked up from `package.json`, for cosmetic purposes.
         *
         * @name app-version
         * @type {string}
         */
        ["app-version", require("../package.json").version],
        /**
         * Whether the debugger should break on the first event after the program starts.
         *
         * @name debug-break-on-entry
         * @type {boolean}
         * @default false
         */
        ["debug-break-on-entry", false],
        /**
         * The environment won't keep running if a breakpoint is hit.
         *
         * @name debug-sync-environment
         * @type {boolean}
         * @default true
         */
        ["debug-sync-environment", true],
        /**
         * Whether the environment is sychronous (e.g. turn-based) or asynchronous (e.g. real-time). Note that asynchronous is currently untested.
         *
         * @name environment-synchronous
         * @type {boolean}
         * @default true
         */
        ["environment-synchronous", true],
        /**
         * If the environment is synchronous, how long to wait before worrying that we haven't gotten a `nextTick()`.
         *
         * @name environment-sync-watchdog-timeout
         * @type {number}
         * @default 3000
         */
        ["environment-sync-watchdog-timeout", 3000],
        /**
         * The interval of ticks in a synchronous environment.
         *
         * @name environment-async-time
         * @type {number}
         * @default 100
         */
        ["environment-async-time", 100],
        /**
         * The database name to use within the Graph Database.
         *
         * @name graphdb-name
         * @type {string}
         * @default nhai
         */
        ["graphdb-name", "nhai"],
        /**
         * Path to directory where HTML templates are stored.
         *
         * @name html-template-dir
         * @type {string}
         * @default assets/hbs
         */
        ["html-template-dir", path.resolve(__dirname, "../assets/hbs")],
        /**
         * The location / country used for interpreting date / time. Used for logging and potentially other timestamps.
         *
         * @name locale
         * @type {string}
         * @default default
         */
        ["locale", "default"],
        /**
         * For `error` and `fatal` messages, always log the stack regardless of whether an Error was logged.
         *
         * @name log-error-stack
         * @type {boolean}
         * @default false
         */
        ["log-error-stack", false],
        /**
         * Maximum number of lines to print from the stack dump. Applies globally.
         *
         * @name log-error-stack-length
         * @type {integer}
         * @default 64
         */
        ["log-error-stack-length", 64],
        /**
         * Default level of messages that should be printed: trace, debug, info, warn, error, fatal.
         *
         * @name log-level
         * @type {string}
         * @default trace
         */
        ["log-level", "trace"],

        // ["log-src", false], // TODO this is slow; whether the logger should print the source code file and line.

        /**
         * Whether Log.init should monkey patch console.log
         *
         * @name log-patch-console
         * @type {boolean}
         * @default true
         */
        ["log-patch-console", true],
        /**
         * Print a "Starting..." msg when logger is initialized.
         *
         * @name log-start-msg
         * @type {boolean}
         * @default false
         */
        ["log-start-msg", false],
        /**
         * Force color logging, even if not ta TTY (can be messy but good for testing).
         *
         * @name log-force-color
         * @type {boolean}
         * @default true
         */
        ["log-force-color", true],
        /**
         * Whether to write log messages to a file.
         *
         * @name log-file-enabled
         * @type {boolean}
         * @default false
         */
        ["log-file-enabled", false],
        /**
         * Set which log messages get written to a file
         *
         * @name log-file-level
         * @type {string}
         * @default "info"
         */
        ["log-file-level", "info"],
        /**
         * First part of the file name when writting log files
         *
         * @name log-file-prefix
         * @type {string}
         * @default nhai-
         */
        ["log-file-prefix", "nhai-"],
        /**
         * Last part of the file name when writing log files
         *
         * @name log-file-suffix
         * @type {string}
         * @default .log
         */
        ["log-file-suffix", ".log"],
        /**
         * Path to the directory for storing log files
         *
         * @name log-file-path
         * @type {string}
         * @default .
         */
        ["log-file-path", "."],
        /**
         * Seed for the PRNG / DRNG
         *
         * @name random-seed
         * @type {string}
         * @default goodluck!
         */
        ["random-seed", "goodluck!"],
        /**
         * The redis graph database server IP address
         *
         * @name redisgraph-server
         * @type {string}
         * @default 127.0.0.1
         */
        ["redisgraph-server", "127.0.0.1"],
        /**
         * The redis graph database server port.
         *
         * @name redisgraph-port
         * @type {string}
         * @default 6379
         */
        ["redisgraph-port", 6379],
        /**
         * The redis graph database connection options.
         *
         * @name redisgraph-options
         * @type {object}
         * @default undefined
         */
        ["redisgraph-options", undefined],
        /**
         * The directory holding JSON schemas to validate various data types
         *
         * @name schema-dir
         * @type {string}
         */
        ["schema-dir", path.resolve(__dirname, "../assets/schema")],

        // ["shell-enabled", true], // whether to start the shell
        // ["shell-prompt", "$"], // default shell prompt symbol
    ],
);

let configMap = new Map();
let configFiles = [];
let loadComplete = false;

/**
 * The global configuration object for getting and setting configuration values.
 */
class Config {
    /**
     * Initializes the configuration, reading config files and such
     */
    static async init() {
        if (Config.isLoaded) {
            return;
        }

        configFiles.length = 0;
        configMap = new Map(defaultConfigMap.entries());

        let appName;
        do {
            appName = Config.get("app-name");
            await loadAppConfig();
        } while (appName !== Config.get("app-name"));
    }

    /** the path to the configuration file that was loaded, or null if none was loaded */
    static get fileList() {
        return configFiles;
    }

    /**
     * Returns a Map containing the global configuration values
     *
     * @returns {Map} A map containing key / value pairs of configuration settings
     */
    static getConfig() {
        return configMap;
    }

    /**
     * Gets the configuration value for the specified key
     *
     * @param {string} key - The name of the configuration value to retrieve
     * @returns {*}     The configuration value
     */
    static get(key) {
        // checkType("Config.get", "key", key, "string");
        return configMap.get(key);
    }

    /**
     * Sets the configuration value for the specified key
     *
     * @param {string} key - The name of the configuration value to assign
     * @param {*}      val - The value to assign
     */
    static set(key, val) {
        // checkType("Config.set", "key", key, "string");
        configMap.set(key, val);
    }

    /**
     * Reset all config values to their defaults and remove any non-default values
     */
    static reset() {
        configMap.clear();
        configFiles.length = 0;

        for (let entry of defaultConfigMap.entries()) {
            configMap.set(... entry);
        }

        loadComplete = false;
    }

    /**
     * Load a config using the specified Object as the key-value config settings
     *
     * @param   {object} confObj An Object where every key is a config parameter name and the associated value is the config value
     */
    static load(confObj) {
        const {checkType} = require("./Utility");
        checkType("Config.load", "confObj", confObj, "object");

        for (let key of Object.keys(confObj)) {
            // console.info(`merging: '${key}' = '${confObj[key]}'`);
            Config.set(key, confObj[key]);
        }

        loadComplete = true;

        return this.getConfig();
    }

    /** boolean indicating whether a configuration has been loaded */
    static get isLoaded() {
        return loadComplete;
    }
}

async function loadAppConfig() {
    let appName = Config.get("app-name");
    let explorerSync = cosmiconfigSync(appName, cosmiconfigOpts);

    let configResult = explorerSync.search();
    if (!configResult) {
        return null;
    }

    // console.info("found config:", configResult);

    if (typeof configResult.config !== "object" && typeof configResult.config !== "undefined") {
        throw new Error(`Error loading config (did not produce a config Object): ${configResult.filename}`);
    } else {
        Config.load(configResult.config);
    }

    configFiles.push(configResult);
    return configResult.config;
}

// set defaults
Config.reset();

module.exports = {Config};
