/**
 * The program can be configured with a rc file such as .nhairc, .nhairc.js, .nhairc.yml, etc.
 * see {@link https://www.npmjs.com/package/cosmiconfig|cosmiconfig} for allowed file names.
 * This is documentation for the various config options.
 *
 * @module Config
 */

let {cosmiconfigSync} = require("cosmiconfig");
const cosmiconfigOpts = {};

const defaultConfigMap = new Map(
    [
        /**
         * Name of the application, mostly for cosmetic purposes
         *
         * @name app-name
         */
        ["app-name", "nhai"],
        /**
         * Version of the application picked up from `package.json`, for cosmetic purposes
         *
         * @name app-version
         */
        ["app-version", require("../package.json").version],
        ["debug-break-on-entry", false], // whether the debugger should break on entry
        ["debug-sync-environment", true], // the environment won't keep running if a breakpoint is hit
        ["environment-synchronous", true], // whether the environment is sychronous (e.g. turn-based) or asynchronous (e.g. real-time)
        ["environment-sync-watchdog-timeout", 3000], // if the environment is synchronous, how long to wait before worrying that we haven't gotten a `nextTick()`
        ["environment-async-time", 100], // the interval of ticks in a synchronous environment
        ["locale", "default"], // the location used for interpreting date / time
        ["log-level", "trace"], // default level of messages that should be printed: trace, debug, info, warn, error, fatal
        ["log-src", false], // TODO this is slow; whether the logger should print the source code file and line
        ["log-patch-console", true], // whether Log.init should monkey patch console.log
        ["log-start-msg", false], // print a "Starting..." msg when logger is initialized
        ["log-force-color", true], // force color logging, even if not ta TTY (can be messy but good for testing)
        ["log-file-enabled", false], // whether to write log messages to a file
        ["log-file-prefix", "nhai-"], // name of the file to write logs to
        ["log-file-suffix", ".log"], // name of the file to write logs to
        ["log-file-path", "."], // the path / folder to write logs to
        ["random-seed", "goodluck!"], // seed for the PRNG / DRNG
        ["shell-enabled", true], // whether to start the shell
        ["shell-prompt", "$"], // default shell prompt symbol
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
