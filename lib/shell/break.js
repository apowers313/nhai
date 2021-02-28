/* istanbul ignore file */

/**
 * If the config file has the variable `shell-enabled` set to `true`, the program
 * will start with an interactive shell. This is a description of the shell commands.
 *
 * @module ShellCommands
 */

const {Jupyter} = require("../Jupyter");
const {Breakpoint} = require("../Breakpoint");
const {print, printErr} = require("../Log");

function shellBreak(magicCmd, subCmd) {
    if (subCmd) {
        return;
    }

    // if called without a subcommand, it's shorthand for list
    listBreakpoints();
}
Jupyter.decorateMagic(
    shellBreak,
    __filename,
    "Manages breakpoints",
    ["name", "%break"],
    // ["description", "Lorem ipsum ..."],
    (program) => {
        program
            .command("add")
            .description("Create a new breakpoint")
            .option("--et, --event-type <name>", "Break on events of type 'type'")
            .option("--sn, --source-name <name>", "Break on events from a source named 'name'")
            .option("--st, --source-type <type>", "Break on events from sources of type 'type'")
            .option("-o, --once", "Only break one time and then disable the breakpoint")
            .option("-c, --count <num>", "Break after event has occurred 'num' times")
            .option("-n, --name <name>", "Name the breakpoint 'name'")
            .option("-e, --every", "Break on every event")
            .action(createBreakpoint);
        program
            .command("list")
            .description("Lists all breakpoints")
            .action(listBreakpoints);
        program
            .command("clear [names...]")
            .description("Removes breakpoint(s)", {
                name: "The name(s) of the breakpoint(s) to clear",
            })
            .option("-a, --all", "Clear all breakpoints")
            .action(clearBreakpoint);
        program
            .command("disable <name...>")
            .description("Temporarily disables a breakpoint; Has the same effect as 'delete' but the breakpoint can be 'enable'-ed again later")
            .action(disableBreakpoint);
        program
            .command("enable <name...>")
            .description("Re-enable a breakpoint that has been disabled")
            .action(enableBreakpoint);
    },
);

function listBreakpoints() {
    let bpList = Breakpoint.list;

    if (bpList.length === 0) {
        print("No Breakpoints.");
        return;
    }

    print("Breakpoints:");
    for (let i = 0; i < bpList.length; i++) {
        let num = `(${i + 1})`.padEnd(6);
        print(`${num} ${bpList[i].toString()}`);
    }
}

function createBreakpoint(opts) {
    if (Object.keys(opts).length === 0) {
        printErr("Must specify at least one of --event-type, --source-name, --source-type and / or --every");
        return;
    }

    let name;

    if (opts.name) {
        // eslint-disable-next-line prefer-destructuring
        name = opts.name;
        delete opts.name;
    }

    opts.all = true;
    new Breakpoint(opts, name);
}

function clearBreakpoint(names, opts) {
    if (opts.all) {
        Breakpoint.clearAll();
        return;
    }

    if (names.length === 0) {
        printErr("Must provide a list of breakpoint names or numbers to clear, or the --all flag to clear all breakpoints.");
        return;
    }

    actOnNames(names, "clear");
}

function disableBreakpoint(names) {
    actOnNames(names, "disable");
}

function enableBreakpoint(names) {
    actOnNames(names, "enable");
}

function namesToNumbers(names) {
    return names.map((name) => {
        let num = parseInt(name);
        if (isNaN(num)) {
            return name;
        }

        // convert the number from human format (counting starting with 1)
        // to machine format (counting starting with 0) so that it matches
        // %break list
        return --num;
    });
}

function incrNumbers(names) {
    return names.map((name) => (typeof name === "number") ? ++name : name);
}

function actOnNames(names, action) {
    names = namesToNumbers(names);
    let notFound = names.filter((name) => !Breakpoint[action](name));

    if (notFound.length !== 0) {
        notFound = incrNumbers(notFound);
        printErr(`Breakpoint(s) not found: ${notFound.join(", ")}`);
    }
}

Jupyter.addMagic("%break", shellBreak);
Jupyter.addMagic("%bk", shellBreak);

