let configMap = new Map(
    [
        ["app-name", "nhai"], // name of the application, for cosmetic purposes
        ["version", require("../package.json").version], // version of the application, for cosmetic purposes
        ["log-level", "trace"], // default level of messages that should be printed: trace, debug, info, warn, error, fatal
        ["log-src", false], // TODO this is slow; whether the logger should print the source code file and line
        ["shell-enabled", true],
        ["shell-prompt", "$"],
        ["random-seed", "goodluck!"],
    ],
);

/**
 * The global configuration object for getting and setting configuration values.
 */
class Config {
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
}

module.exports = Config;
