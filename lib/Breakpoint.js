const {Config} = require("./Config");
const {Trace} = require("./Trace");
const {EventFilter} = require("./EventFilter");
const {checkType} = require("./Utility");

let doBreak = Config.get("debug-break-on-entry");
let runFn = undefined;
let bpGenericName = 0;

const breakpointList = [];

class Breakpoint extends EventFilter {
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

        this.count = count;
        this.currentCount = 0;
        this.once = once;
        this.every = every;
        this.disabled = (typeof disabled === "boolean") ? disabled : false;
        this.name = name || `bp${++bpGenericName}`;

        // save breakpoint
        breakpointList.push(this);
    }

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

    disable() {
        this.disabled = true;
    }

    enable() {
        this.disabled = false;
    }

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
     * Evaluates whether the specified event triggers a breakpoint
     *
     * @param   {EventBase}   e  An event that is derived from EventBase
     * @param   {Function} cb A callback function for when resuming from the break
     * @returns {Promise}      a Promise that resolves when resuming from the breakpoint
     */
    static async checkBreak(e, cb) {
        Trace.addEvent(e);

        // check all breakpoints in list
        for (let i = 0; i < breakpointList.length; i++) {
            let bp = breakpointList[i];
            if (bp.matchEvent(e)) {
                doBreak = true;
                if (bp.once) {
                    bp.disable();
                }

                break;
            }
        }

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

    static get list() {
        let list = [];
        breakpointList.forEach((bp) => list.push(bp.toString()));
        return list;
    }

    // static clear(number|name) {}
    static clearAll() {
        breakpointList.length = 0;
        bpGenericName = 0;
    }
}

module.exports = {
    Breakpoint,
};
