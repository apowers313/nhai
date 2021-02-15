const {Config} = require("./Config");
const {Trace} = require("./Trace");
const {EventFilter} = require("./EventFilter");
const {checkType} = require("./Utility");

let doBreak = Config.get("debug-break-on-entry");
let runFn = undefined;

class Breakpoint extends EventFilter {
    /**
     * Evaluates whether the specified event triggers a breakpoint
     *
     * @param   {EventBase}   e  An event that is derived from EventBase
     * @param   {Function} cb A callback function for when resuming from the break
     * @returns {Promise}      a Promise that resolves when resuming from the breakpoint
     */
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

    /**
     * Sets a new breakpoint
     */
    static setBreakpoint() {
        doBreak = true;
    }

    /**
     * Resumes running after a breakpoint has been triggered
     */
    static run() {
        checkType("Breakpoint.run", "runFn", runFn, "function");
        setImmediate(runFn);
        runFn = undefined;
        doBreak = false;
    }

    /** true if a break has been triggered */
    static get inBreak() {
        return !!runFn;
    }

    /** true if a break has been triggered */
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
