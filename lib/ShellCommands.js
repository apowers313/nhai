const {Shell} = require("./Shell");
const {Component} = require("./Component");
const {Trace} = require("./Trace");
const {Perception} = require("./Perception");
const {EventListener, EventFilter} = require("./EventBase");
const {info, warn, error} = require("./Log");

Shell.addDefaultCommand(
    "break",
    "Set a breakpoint",
    function(... args) {
        warn("Setting breakpoint: *");
        Trace.setBreakpoint("*");
    },
);

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

Shell.addDefaultCommand(
    "exit",
    "Exit the program",
    function() {
        process.exit(0);
    },
);
