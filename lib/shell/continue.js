const {Jupyter} = require("../Jupyter");
const {Breakpoint} = require("../Breakpoint");
const {info, printErr} = require("../Log");

function shellContinue() {
    if (!Breakpoint.inBreak) {
        printErr("Continue failed: not currently in a breakpoint");
        return;
    }

    info("Continuing program execution.");
    Breakpoint.run();
}

Jupyter.decorateMagic(
    shellContinue,
    __filename,
    "Continue running program after a breakpoint has been encountered",
    ["name", "%continue"],
);

Jupyter.addMagic("%continue", shellContinue);
Jupyter.addMagic("%cont", shellContinue);
