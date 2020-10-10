const {EventBase, EventBusBase} = require("./EventBase");
const {checkType, checkInstance} = require("./Utility");

/**
 * A component that implements some functionality and communicates with other components. Used as a base class for various
 * parts of the system that will interact through events.
 */
class Component {
    /**
     * constructor
     *
     * @param {string | EventBase} name       - The name of the module or an event derived from EventBase. If an event, `type` and `mod` arguments are not used.
     * @param {string}             type       - The type of the module
     * @param {EventBase}          eventClass - The class to use for events for this component
     *
     * @returns {Component}      The Object that was created
     * @todo * registered module must be of a specific type (Perception, FeatureExtractor, etc.)
     * @todo * type should be from a controlled vocabulary
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
        if (!(this.eventBus instanceof EventBusBase)) throw new TypeError("Component constructor expected 'eventClass' to have an eventBus");
        this.sendEvent("register", this);
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
        e.emit(type, data);
    }

    /**
     * Registers a component on the global component list
     *
     * @param   {Component} comp The component to be registered
     */
    static register(comp) {
        checkInstance("Component.register", "comp", comp, Component);
        if (componentMap.has(comp.name) && componentMap.get(comp.name) !== comp) throw new Error("can't register a module with a duplicate name and a different object");

        componentMap.set(comp.name, comp);
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

module.exports = Component;
