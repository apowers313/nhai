const {EventBase, EventBusBase} = require("./EventBase");
const {checkType, checkInstance} = require("./Utility");

/**
 * A component that implements some functionality and communicates with other components. Used as a base class for various
 * parts of the system that will interact through events.
 *
 * @property {string}    name       - The name of the component
 * @property {type}      string     - The type of the component
 * @property {EventBase} eventClass - A constructor function for the class of events used by the component
 */
class Component {
    /**
     * constructor
     *
     * @param {string}    name       - The name of the module.
     * @param {string}    type       - The type of the module
     * @param {EventBase} eventClass - The class to use for events for this component
     *
     * @returns {Component}      The Object that was created
     */
    constructor(name, type, eventClass) {
        checkType("Component.constructor", "name", name, "string");
        checkType("Component.constructor", "type", type, "string");
        checkType("Component.constructor", "eventClass", eventClass, "class");
        checkInstance("Component.constructor", "eventClass", eventClass.prototype, EventBase);

        this.name = name;
        this.type = type;
        this.eventClass = eventClass;

        Component.register(this);
        this.eventBus = this.eventClass.prototype.eventBus;
        checkInstance("Component.constructor", "eventBus", this.eventBus, EventBusBase);
    }

    /**
     * Emits an event using the specified eventClass
     *
     * @param {string} type - The event type to emit
     * @param {*}      data - The data to emit
     */
    sendEvent(type, data) {
        checkType("sendEvent", "type", type, "string");
        let e = new this.eventClass(this.name, this.type);
        return e.emit(type, data);
    }

    /**
     * Registers a component on the global component list
     *
     * @param   {Component} comp The component to be registered
     */
    static register(comp) {
        checkInstance("Component.register", "comp", comp, Component);
        if (componentMap.has(comp.name) && componentMap.get(comp.name) !== comp) {
            throw new Error("can't register a module with a duplicate name and a different object");
        }

        componentMap.set(comp.name, comp);
    }

    /**
     * Look up a Component using its name
     *
     * @param   {string} name The name of the Component passed in at registration time
     * @returns {Component}      The Component with the corresponding name or `undefined` if none was found
     */
    static get(name) {
        return componentMap.get(name);
    }

    /**
     * A global list of all components that have been registered. Value is a `Map` of {@link Component|Components}.
     * Map keys are the component name.
     */
    static get list() {
        return componentMap;
    }

    /**
     * Clears the global list of registered Components. Mostly used for testing.
     */
    static clearList() {
        componentMap.clear();
    }
}

const componentMap = new Map();

module.exports = {Component};
