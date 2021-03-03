const {Jupyter} = require("../Jupyter");
const {Breakpoint} = require("../Breakpoint");
// const {debug, print, warn, printErr} = require("../Log");

const l = require("../Log");
console.log("l", l);
console.log("l.info", l.info);
const {info, printErr} = l;

function shellStep() {
    if (!Breakpoint.inBreak) {
        printErr("Step failed: not currently in a breakpoint");
        return;
    }

    info("Stepping program execution.");
    Breakpoint.run();
    Breakpoint.setBreakpoint();
}

Jupyter.decorateMagic(
    shellStep,
    __filename,
    "Run the program for one more event and then break",
    ["name", "%step"],
);

Jupyter.addMagic("%step", shellStep);
