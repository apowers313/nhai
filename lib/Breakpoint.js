const {Config} = require("./Config");
const {Trace} = require("./Trace");
const {EventFilter} = require("./EventFilter");
const {checkType} = require("./Utility");

let doBreak = Config.get("debug-break-on-entry");
let runFn = undefined;

class Breakpoint extends EventFilter {
    static async checkBreak(e, cb) {
        Trace.addEvent(e);

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
        checkType("Breakpoint.run", "runFn", runFn, "function");
        setImmediate(runFn);
        runFn = undefined;
        doBreak = false;
    }

    static get inBreak() {
        return !!runFn;
    }

    static get setBreak() {
        return doBreak;
    }

    // static list() {}
    // static clear(number|name) {}
    // static clearAll() {}
}

module.exports = {
    Breakpoint,
};
