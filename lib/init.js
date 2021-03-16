/* istanbul ignore file */

const {Config} = require("./Config");
const Log = require("./Log");
const {Breakpoint} = require("./Breakpoint");
const {Synchronize} = require("./Synchronize");
const {Significance} = require("./Significance");
const {trace, debug, info, warn} = Log;

/**
 * Initializes all the libraries and components
 */
module.exports = async function init() {
    await Config.init();
    await Log.init();
    await Breakpoint.init();

    let dateTimeOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short",
    };
    let dateTimeLocale = Config.get("locale");

    if (Config.get("log-start-msg")) {
        info(`Starting: ${Config.get("app-name")} v${Config.get("app-version")} :: ${new Intl.DateTimeFormat(dateTimeLocale, dateTimeOptions).format()} [${process.platform}, ${process.arch}]`);
        Config.fileList.forEach((v) => Log.debug(`Loaded config file: ${v.filepath}`));
        trace("Final Configuration:", Config.getConfig());
    }

    process.on("exit", (code) => debug(`Done. Exiting with status ${code}.`));
    process.on("multipleResolves", (type, promise, reason) => warn(`Multiple Promise resolutions: ${type}, ${promise}, ${reason}`));
    process.on("rejectionHandled", (reason, promise) => warn(`Late handled Promise: ${reason}, ${promise}`));
    process.on("warning", (warning) => warn(`WARNING: ${warning.name}, ${warning.message}, ${warning.stack}`));
    // XXX: uncommenting this may break the emscripten / WASM in NetHack
    // process.on("uncaughtExceptionMonitor", (err, origin) => {
    //     error(`Uncaught Exception or Rejection: ${err}, ${origin}`);
    //     throw err;
    // });
    process.on("SIGINT", () => {
        info("Process caught SIGINT, exiting.");
        process.exit(0);
    });

    await Synchronize.init();
    await Significance.init();
};
