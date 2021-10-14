const {Jupyter} = require("../Jupyter");
const {Breakpoint} = require("../Breakpoint");
// const {debug, print, warn, printErr} = require("../Log");

const l = require("../Log");
const {info, printErr} = l;

async function shellStep() {
    let opts = this.args;

    // not in a breakpoint and not going to wait to hit one...
    if (!Breakpoint.inBreak && !opts.wait) {
        printErr("Step failed: not currently in a breakpoint");
        return;
    }

    // / not in a breakpoint and waiting to hit one...
    while (!Breakpoint.inBreak && opts.wait) {
        await delay(250);
    }

    info("Stepping program execution.");
    Breakpoint.run();
    Breakpoint.setBreakpoint();
}

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

Jupyter.decorateMagic(
    shellStep,
    __filename,
    "Run the program for one more event and then break",
    ["name", "%step"],
    ["option", "-w, --wait", "if the code is currently running in the background, wait for it to hit a breakpoint before stepping"],
);

Jupyter.addMagic("%step", shellStep);
