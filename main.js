const nethackShimCallback = require("./src/nethackCallback");
const {init, Log} = require("./index");
let nethackInternalLogger;
/* global WebAssembly */
const BYTES_PER_KB = 1024;
const NS_PER_SEC = 1e9;
const US_PER_SEC = 1e6;
let runCount = 0;
let startTime;
let startUsage;

// this returns an Object containing the emscription Module options
// the NetHack emscripten implementation adds lots of state information
// to the Object, so we have to build a new one each time we want to run
// NetHack
function buildWasmModule() {
    let {info, warn} = nethackInternalLogger;
    return {
        logReadFiles: true,
        noExitRuntime: false,
        noInitialRun: false,
        print: info,
        printErr: warn,
        // undocumented callback function that is run when the emscripten program completes
        quit: function(errorCode) {
            let cpuUsage = process.cpuUsage(startUsage);
            let endTime = process.hrtime.bigint();
            let runTime = endTime - startTime;
            console.info(`NetHack run # ${runCount} completed with status: ${errorCode} :: Run time: ${ns2s(runTime)}   User CPU: ${cpuUsage.user / US_PER_SEC} sec.   System CPU: ${cpuUsage.system / US_PER_SEC} sec.`);
            // run NetHack in an infinite loop
            runNethack();
        },
    };
}

function runNethack() {
    runCount++;
    console.info(`Starting NetHack: run #${runCount}`);
    let {rss, heapTotal, heapUsed, external, arrayBuffers} = process.memoryUsage();
    let percentHeap = (heapUsed / heapTotal) * 100;
    console.debug(`Heap Usage: ${b2s(heapUsed)} (${percentHeap.toFixed(1)}% of ${b2s(heapTotal)}) :: ArrayBuffers: ${b2s(arrayBuffers)}   External: ${b2s(external)}   [[ Total Memory (RSS): ${b2s(rss)} ]]`);
    clearRequireCache();
    let nethackStart = require("@neth4ck/neth4ck");
    setTimeout(() => {
        startUsage = process.cpuUsage();
        startTime = process.hrtime.bigint();
        nethackStart(nethackShimCallback, buildWasmModule());
        process.removeAllListeners("uncaughtException");
        process.on("uncaughtException", function(ex) {
            console.warn("uncaughtException (but it's okay)");
            // TODO: check if message is "unreachable" and top of stack is "at nh_terminate (<anonymous>:wasm-function[974]:0x13abdd)"
            if (!(ex instanceof WebAssembly.RuntimeError)) {
                console.error("THROWING", ex);
                throw ex;
            }
        });
    }, 0);
}

// # bytes to string
function b2s(b) {
    let size = 0;

    while (b > BYTES_PER_KB) {
        b = b / BYTES_PER_KB;
        size++;
    }

    switch (size) {
    case 0: return `${b.toFixed(2)} B`;
    case 1: return `${b.toFixed(2)} KB`;
    case 2: return `${b.toFixed(2)} MB`;
    case 3: return `${b.toFixed(2)} GB`;
    case 4: return `${b.toFixed(2)} TB`;
    default: return `${b.toFixed(2)} ??`;
    }
}

// nanoseconds to seconds string
function ns2s(ns) {
    let s = BigInt(ns) / BigInt(NS_PER_SEC);
    // ns = ns - (BigInt(ns) / BigInt(NS_PER_SEC));
    // return `${s}.${ns} sec.`;
    return `${s} sec.`;
}

function clearRequireCache() {
    for (let key of Object.keys(require.cache)) {
        delete require.cache[key];
    }
}

/* int main(int argc, char **argv) */
(async function() {
    await init();
    nethackInternalLogger = new Log("nethack-internal");
    runNethack();
})();

