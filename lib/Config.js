let configMap = new Map(
    [
        ["version", require("../package.json").version],
        ["app-name", "nhai"],
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

    static get(key) {
        return configMap.get(key);
    }

    static set(key, val) {
        configMap.set(key, val);
    }
}

module.exports = Config;
