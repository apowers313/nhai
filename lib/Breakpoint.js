const {Config} = require("./Config");
const {Trace} = require("./Trace");
const {EventFilter} = require("./EventFilter");
const {checkType} = require("./Utility");

let doBreak;
let runFn = undefined;
let bpGenericName = 0;
const breakpointList = [];

class Breakpoint extends EventFilter {
    /**
     * Used to stop running code when specific criteria are met
     *
     * @param   {object} criteria Critera for when the Breakpoint should stop code from running. See {@link EventFilter} for details
     * @param   {string} name     Optional name for this breakpoint. If no name is specified, a default name will be assigned.
     * @returns {Breakpoint}      The Breakpoint that was created
     */
    constructor(criteria, name) {
        // setup breakpoint
        let {count} = criteria;
        delete criteria.count;
        let {once} = criteria;
        delete criteria.once;
        let {every} = criteria;
        delete criteria.every;
        let {disabled} = criteria;
        delete criteria.disabled;

        // if breaking on every event, use dummy criteria
        if (every) {
            criteria = {
                sourceName: "__allEvents__",
                all: true,
            };
        }

        super("allow", criteria);

        // TODO: check that count is a number

        this.count = count;
        this.currentCount = 0;
        this.once = !!once;
        this.every = !!every;
        this.disabled = (typeof disabled === "boolean") ? disabled : false;
        this.name = name || `bp${++bpGenericName}`;

        // save breakpoint
        breakpointList.push(this);
    }

    /**
     * Clears this breakpoint by removing it from the global breakpoint list
     */
    clear() {
        this.disabled = true;

        let idx = breakpointList.indexOf(this);

        // not found, ignore
        if (idx === -1) {
            return;
        }

        // delete this item from the list
        breakpointList.splice(idx, 1);
    }

    /**
     * Disables this breakpoint
     */
    disable() {
        this.disabled = true;
    }

    /**
     * Enables this Breakpoint
     */
    enable() {
        this.disabled = false;
    }

    /**
     * Determines if this Breakpoint matches event 'e' based on the 'criteria' specified when the Breakpoint was created. Used to determine if the program should stop.
     *
     * @param   {EventBase} e The event to be evaluated
     * @returns {boolean}   Returns `true` if the event matches this Breakpoint's criteria, `false` otherwise
     */
    matchEvent(e) {
        if (this.disabled) {
            return false;
        }

        if (this.every) {
            return true;
        }

        let match = super.matchEvent(e);

        if (match && this.count) {
            this.currentCount++;
            if (this.currentCount === this.count) {
                this.currentCount = 0;
                return true;
            }

            return false;
        }

        return match;
    }

    /**
     * Converts the Breakpoint to a human-readable String
     */
    toString() {
        // bp1: "sourceType:xyz,eventType:abc" (0/100) [disabled,once,all]
        let {name} = this;
        let count = this.count ? ` (${this.currentCount}/${this.count})` : "";

        // build criteria string
        let critList = [];

        if (this._criteria.sourceType) {
            critList.push(`sourceType:${this._criteria.sourceType}`);
        }

        if (this._criteria.sourceName) {
            critList.push(`sourceName:${this._criteria.sourceName}`);
        }

        if (this._criteria.eventType) {
            critList.push(`eventType:${this._criteria.eventType}`);
        }

        let criteria = critList.join(",");

        if (this._criteria.all) {
            criteria = `all::${criteria}`;
        } else if (this._criteria.any) {
            criteria = `any::${criteria}`;
        } else if (this._criteria.none) {
            criteria = `none::${criteria}`;
        } else {
            criteria = `<unknown>::${criteria}`;
        }

        if (this.every) {
            criteria = "*";
        }

        // build flag string
        let flagList = [];
        if (this.disabled) {
            flagList.push("disabled");
        }

        if (this.once) {
            flagList.push("once");
        }

        // if (this.every) {
        //     flagList.push("every");
        // }

        let flags = flagList.length ? ` [${flagList.join(",")}]` : "";

        return `${name}: "${criteria}"${count}${flags}`;
    }

    /**
     * Initialize breakpoints, typically called by init()
     */
    static init() {
        doBreak = Config.get("debug-break-on-entry");
    }

    /**
     * Evaluates whether the specified event triggers a breakpoint
     *
     * @param   {EventBase}   e  An event that is derived from EventBase
     * @param   {Function} cb A callback function for when resuming from the break
     * @returns {Promise}      a Promise that resolves when resuming from the breakpoint
     */
    static async checkBreak(e, cb) {
        Trace.addEvent(e);

        let bp;
        // check all breakpoints in list
        for (let i = 0; i < breakpointList.length; i++) {
            bp = breakpointList[i];
            if (bp.matchEvent(e)) {
                doBreak = true;
                if (bp.once) {
                    bp.disable();
                }

                break;
            }
        }
        // console.debug(`Breakpoint evaluation (${doBreak}): ${e}`);

        // if we hit a breakpoint
        if (doBreak) {
            if (bp) {
                console.info("Stopping execution for breakpoint:", bp.toString());
            } else {
                console.info("Breakpoint encountered.");
            }

            console.debug("Breakpoint triggered by event:", e.toString());
            if (Config.get("debug-sync-environment")) {
                checkType("checkBreak", "runFn", runFn, "undefined");
            }

            const {Synchronize} = require("./Synchronize");
            Synchronize.pauseWatchdog();

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

        const {Synchronize} = require("./Synchronize");
        Synchronize.startWatchdog();

        runFn = undefined;
        doBreak = false;
    }

    /**
     * Find breakpoints with the corresponding 'name'
     *
     * @param   {string} name The name of the breakpoint(s) to find
     * @returns {Array<Breakpoint>}      An Array of Breakpoints that were found, or an empty array if none were found.
     */
    static find(name) {
        if (typeof name === "number") {
            let bp = breakpointList[name];
            if (bp === undefined) {
                return [];
            }

            return [bp];
        }

        return breakpointList.filter((bp) => bp.name === name);
    }

    /**
     * Delete a breakpoint
     *
     * @param   {string | number} name The name or number of the breakpoint. If multiple breakpoints with the same name are found, they are all cleared.
     * @returns {boolean}      Returns `true` if the breakpoint was found and enabled, false otherwise.
     */
    static clear(name) {
        return findAndAct(name, "clear");
    }

    /**
     * Disable a breakpoint so that it still exists, but doesn't trigger
     *
     * @param   {string | number} name The name or number of the breakpoint. If multiple breakpoints with the same name are found, they are all disabled.
     * @returns {boolean}      Returns `true` if the breakpoint was found and enabled, false otherwise.
     */
    static disable(name) {
        return findAndAct(name, "disable");
    }

    /**
     * Enable a previously disabled breakpoint
     *
     * @param   {string | number} name The name or number of the breakpoint. If multiple breakpoints with the same name are found, they are all enabled.
     * @returns {boolean}      Returns `true` if the breakpoint was found and enabled, false otherwise.
     */
    static enable(name) {
        return findAndAct(name, "enable");
    }

    /**
     * Clear all breakpoints
     */
    static clearAll() {
        breakpointList.length = 0;
        bpGenericName = 0;
    }

    /** true if a break has been triggered */
    static get inBreak() {
        return !!runFn || !!doBreak;
    }

    /** Array of breakpoint strings, as returned by `toString` */
    static get list() {
        let list = [];
        breakpointList.forEach((bp) => list.push(bp.toString()));
        return list;
    }
}

function findAndAct(name, action, ... args) {
    let bpList = Breakpoint.find(name);

    if (bpList.length === 0) {
        return false;
    }

    bpList.forEach((bp) => bp[action](... args));

    return true;
}

module.exports = {
    Breakpoint,
};
