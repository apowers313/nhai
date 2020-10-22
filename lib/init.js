const {Config} = require("./Config");
const Log = require("./Log");
const {trace, debug, info, warn, error} = Log;
const {Shell} = require("./Shell");

/**
 * Initializes all the libraries and components
 */
module.exports = async function init() {
    await Config.init();
    await Log.init();

    if (Config.get("log-start-msg")) {
        info("Starting:", Config.get("app-name"), Config.get("version"));
        Config.configFileList.forEach((v) => Log.debug(`Loaded config file: ${v.filepath}`));
        trace("Final Configuration:", Config.getConfig());
    }

    process.on("exit", (code) => debug(`Done. Exiting with status ${code}.`));
    process.on("multipleResolves", (type, promise, reason) => warn(`Multiple Promise resolutions: ${type}, ${promise}, ${reason}`));
    process.on("rejectionHandled", (reason, promise) => warn(`Late handled Promise: ${reason}, ${promise}`));
    process.on("warning", (warning) => warn(`WARNING: ${warning.name}, ${warning.message}, ${warning.stack}`));
    process.on("uncaughtExceptionMonitor", (err, origin) => {
        error(`Uncaught Exception or Rejection: ${err}, ${origin}`);
        throw err;
    });
    process.on("SIGINT", () => {
        info("Process caught SIGINT, exiting.");
        process.exit(0);
    });

    await Shell.init();
};
