const {Config} = require("./Config");
const Log = require("./Log");
const EventEmitter = require("events");

let tickCount;
let isSync;
let initialized = false;
let hadTick;
let timerHandle;
let emitter;

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
            timerHandle = setInterval(Synchronize.syncWatchdog, Config.get("environment-sync-watchdog-timeout"));
        } else {
            Log.warn("Synchronize detected asynchronous environment: this mode is untested");
            timerHandle = setInterval(_nextTick, Config.get("environment-async-time"));
        }

        emitter = new EventEmitter();
    }

    /**
     * Used by synchronus environments to indicate that a synchronous step has been taken.
     *
     * @throws Error if used with an asynchronous environment (Config "environment-synchronous" === `false`)
     */
    static nextTick() {
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
     * @param   {Function} cb The callback to be called by `nextTick`
     */
    static register(cb) {
        emitter.on("tick", cb);
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
    static shutdown() {
        initialized = false;
        tickCount = undefined;
        emitter = undefined;
        clearInterval(timerHandle);
    }

    /**
     * The default synchronus watchdog. Mostly used internally and exposed for testing.
     */
    static syncWatchdog() {
        console.log("calling watchdog");
        if (!hadTick) {
            console.log("THROWING");
            throw new Error(`Synchronize synchronous watchdog timed out after ${Config.get("environment-sync-watchdog-timeout")}ms without Synchronize.nextTick() being called`);
        }

        hadTick = false;
    }
}

function _nextTick() {
    console.log("tick");
    tickCount++;
    emitter.emit("tick", tickCount);
}

module.exports = {
    Synchronize,
};
