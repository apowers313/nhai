const {Jupyter} = require("../Jupyter");
const {Component} = require("../Component");
const {Perception} = require("../Perception");
const {EventListener} = require("../EventBase");
const {info, warn, error} = require("../Log");
const {EventFilter} = require("../EventFilter");

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
