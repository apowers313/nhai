/* istanbul ignore file */

/**
 * If the config file has the variable `shell-enabled` set to `true`, the program
 * will start with an interactive shell. This is a description of the shell commands.
 *
 * @module ShellCommands
 */

const {Shell} = require("./Shell");
const {Component} = require("./Component");
const {Trace} = require("./Trace");
const {Perception} = require("./Perception");
const {EventListener, EventFilter} = require("./EventBase");
const {info, warn, error} = require("./Log");

/**
 * Sets a breakpoint
 *
 * @name break
 */
Shell.addDefaultCommand(
    "break",
    "Set a breakpoint",
    function() {
        warn("Setting breakpoint: *");
        Trace.setBreakpoint("*");
    },
);

/**
 * Watch events from a component from a specific name
 *
 * @name watch
 * @example
 * watch vision
 */
Shell.addDefaultCommand(
    "watch",
    "Watch a stream of events",
    function(name) {
        let cl = [... Component.list.values()];
        let foundCl = cl.filter((c) => c.name === name);
        if (foundCl.length === 0) {
            error(`'${name}' is not a valid Component name. Valid options are: ${cl.map((c) => c.name).join(", ")}`);
            return;
        }

        warn(`Watching: ${name}`);
        let filter = new EventFilter("allow", {sourceName: name, all: true});
        new EventListener(Perception.eventBus, filter, function(e) {
            info(e.data.toString());
        });
    },
);

/**
 * Exits the program
 *
 * @name exit
 */
Shell.addDefaultCommand(
    "exit",
    "Exit the program",
    function() {
        process.exit(0);
    },
);
