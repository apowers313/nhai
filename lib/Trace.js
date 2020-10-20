const {Config} = require("./Config");
const {checkType} = require("./Utility");

// let doBreak = Config.get("debug-break-on-entry");
let doBreak = false;
let runFn = undefined;
const eventList = [];

/**
 * Tracing execution flow, used for debugging and research
 */
class Trace {
    static getEventHistory() {
        return [... eventList];
    }

    static clearEventHistory() {
        eventList.length = 0;
    }

    static async checkBreak(e, cb) {
        eventList.push(e);

        // if we hit a breakpoint
        if (doBreak) {
            // console.log("DOING BREAK");
            if (Config.get("debug-sync-environment")) {
                checkType("checkBreak", "runFn", runFn, "undefined");
            }

            return new Promise((resolve) => {
                runFn = () => {
                    resolve(cb());
                };
            });
        }

        return cb();
    }

    static setBreakpoint() {
        doBreak = true;
    }

    static run() {
        checkType("Trace.run", "runFn", runFn, "function");
        setImmediate(runFn);
        runFn = undefined;
    }

    // static listBreakpoints() {}
    // static clearBreakpoint() {}
    // static clearAllBreakpoints() {}
}

module.exports = {
    Trace,
};
