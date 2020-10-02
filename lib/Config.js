let configMap = new Map(
    [["version", require("../package.json").version]]
);

/**
 * The global configuration object for getting and setting configuration values.
 */
class Config {
    /**
     * Returns a Map containing the global configuration values
     * @return {Map} A map containing key / value pairs of configuration settings
     */
    static getConfig() {
        return configMap;
    }
}

module.exports = Config;