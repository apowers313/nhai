const {Config} = require("./Config");
const Log = require("./Log");
const {checkType, createHiddenProp} = require("./Utility");
const {EventBase, EventBusBase} = require("./EventBase");

let tickCount;
let isSync;
let initialized = false;
let hadTick;
let timerHandle;

class SynchronizeEvent extends EventBase {
    /**
     * Creates a new event to be sent over the significance bus
     *
     * @param {string} sourceName - The name of the source of the event.
     * @param {string} sourceType - The type of the source.
     */
    constructor(sourceName, sourceType) {
        super();

        checkType("PerceptionEvent.constructor", "sourceName", sourceName, "string");
        checkType("PerceptionEvent.constructor", "sourceType", sourceType, "string");
        createHiddenProp(this, "_sourceName", sourceName, true);
        createHiddenProp(this, "_sourceType", sourceType, true);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get sourceName() {
        return this._sourceName || "initializing";
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get sourceType() {
        return this._sourceType || "initializing";
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get allowedEventTypes() {
        return new Set(["tick"]);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get eventBus() {
        return synchronizeEventBus;
    }
}

const synchronizeEventBus = new EventBusBase(SynchronizeEvent);

/**
 * A singleton class used to synchronize intrinsics, significance, and perceptions.
 * There isn't a biological or cognitive analog, rather this is a crutch to overcome
 * how digital systems interface with their environments.
 */
class Synchronize {
    /**
     * Initialize the Synchronize system
     */
    static init() {
        tickCount = 0;
        isSync = Config.get("environment-synchronous");
        initialized = true;
        hadTick = false;

        if (isSync) {
            Synchronize.startWatchdog();
        } else {
            Log.warn("Synchronize detected asynchronous environment: this mode is untested");
            timerHandle = setInterval(_asyncTick, Config.get("environment-async-time"));
        }
    }

    /**
     * Used by synchronus environments to indicate that a synchronous step has been taken.
     *
     * @throws Error if used with an asynchronous environment (Config "environment-synchronous" === `false`)
     */
    static async nextTick() {
        if (!initialized) {
            throw new Error("Please call Synchronize.init() before Synchronize.nextTick()");
        }

        if (!isSync) {
            throw new Error("Synchronize.nextTick should only be called in a synchronous environment (see: Config('environment-synchronous'))");
        }

        hadTick = true;

        return _nextTick();
    }

    /**
     * Register a callback that will be triggered by `nextTick`.
     * Internally this calls `addListener` on an `EventEmitter`.
     *
     * @param   {Promise<Function>} cb The callback to be called by `nextTick`
     */
    static async register(cb) {
        if (!initialized) {
            throw new Error("Please call Synchronize.init() before Synchronize.register()");
        }

        return synchronizeEventBus.addListener("tick", cb);
    }

    /**
     * Removes a Synchronize listener
     *
     * @param  {Function} cb The callback function that was passed to `register`
     * @returns {Promise}      A Promise that resolves when the listener has been removed.
     */
    static async unregister(cb) {
        return synchronizeEventBus.removeListener("tick", cb);
    }

    /**
     * Number of ticks that have occurred
     */
    static get tickCount() {
        if (!initialized) {
            throw new Error("Please call Synchronize.init() before getting Synchronize.tickCount");
        }

        return tickCount;
    }

    /**
     * Terminate the Synchronization sub-system. Mostly used for testing.
     */
    static async shutdown() {
        initialized = false;
        tickCount = undefined;
        clearInterval(timerHandle);
        return synchronizeEventBus.removeAllListeners();
    }

    /**
     * The default synchronus watchdog. Mostly used internally and exposed for testing.
     */
    static syncWatchdog() {
        if (!hadTick) {
            throw new Error(`Synchronize synchronous watchdog timed out after ${Config.get("environment-sync-watchdog-timeout")}ms without Synchronize.nextTick() being called`);
        }

        hadTick = false;
    }

    /**
     * Pauses the watchdog. Primarily used in Breakpoint.
     */
    static pauseWatchdog() {
        if (!initialized) {
            return;
        }

        clearInterval(timerHandle);
    }

    /**
     * Restarts the watchdog. Primarily used in Breakpoint.
     */
    static startWatchdog() {
        if (!initialized) {
            return;
        }

        timerHandle = setInterval(Synchronize.syncWatchdog, Config.get("environment-sync-watchdog-timeout"));
    }
}

async function _nextTick() {
    tickCount++;
    let e = new SynchronizeEvent("synchronize", "synchronize");
    return e.emit("tick", tickCount);
}

async function _asyncTick() {
    return _nextTick()
        .catch((err) => {
            throw err;
        });
}

module.exports = {
    Synchronize,
};
