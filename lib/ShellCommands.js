/* istanbul ignore file */

/**
 * If the config file has the variable `shell-enabled` set to `true`, the program
 * will start with an interactive shell. This is a description of the shell commands.
 *
 * @module ShellCommands
 */

const {Jupyter} = require("./Jupyter");
const {Config} = require("./Config");
const {Component} = require("./Component");
const {Breakpoint} = require("./Breakpoint");
const {Perception} = require("./Perception");
const {EventListener} = require("./EventBase");
const {info, warn, error} = require("./Log");
const {EventFilter} = require("./EventFilter");

/**
 * Sets a breakpoint
 *
 * @name break
 */
Jupyter.addMagic("%break", shellBreak);
function shellBreak() {
    warn("Setting breakpoint: *");
    Breakpoint.setBreakpoint("*");
}

/**
 * Watch events from a component from a specific name
 *
 * @name watch
 * @example
 * watch vision
 */
Jupyter.addMagic("%watch", shellWatch);
function shellWatch(name) {
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
}

Jupyter.addMagic("%version", shellVersion);
function shellVersion() {
    console.log("version:", Config.get("app-version"));
}
