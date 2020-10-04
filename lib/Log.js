const Config = require("./Config");
const bunyan = require("bunyan");

let defaultLogger = bunyan.createLogger({
    name:   Config.get("app-name"),
    stream: process.stdout,
    level:  "info",
    src:    true, // TODO: remove, this is slow
});

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

    // fatal
    // error
    // warn
    // info
    // debug
    // trace
    static info(... args) {
        defaultLogger.info(... args);
    }
}

module.exports = Log;
